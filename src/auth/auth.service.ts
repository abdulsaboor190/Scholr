import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private allowedDomains: string[];

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {
    const domains = this.configService.get<string>(
      'ALLOWED_EMAIL_DOMAINS',
      'nu.edu.pk,isb.nu.edu.pk',
    );
    this.allowedDomains = domains.split(',').map((d) => d.trim().toLowerCase());
  }

  private validateEmailDomain(email: string): void {
    const [, domain] = email.split('@');
    const domainLower = domain?.toLowerCase();
    if (!domainLower || !this.allowedDomains.includes(domainLower)) {
      throw new ForbiddenException(
        `Only university emails are allowed (${this.allowedDomains.join(', ')})`,
      );
    }
  }

  async register(dto: RegisterDto) {
    try {
      this.validateEmailDomain(dto.email);

      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 12);

      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
        },
      });

      const tokens = await this.generateTokens(user.id, user.email);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      };
    } catch (e: any) {
      throw new ConflictException(`DEBUG ERROR: ${e.message} \n Stack: ${e.stack}`);
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user || !user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      };
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      throw new InternalServerErrorException(`DEBUG ERROR LOGIN: ${e.message} \n Stack: ${e.stack}`);
    }
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      let storedToken: string | null = null;
      try {
        storedToken = await this.redis.get(`refresh_token:${payload.sub}`);
      } catch {
        // If Redis is unavailable, refresh tokens can't be validated.
        throw new UnauthorizedException(
          'Refresh tokens are temporarily unavailable',
        );
      }
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user.id, user.email);
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    try {
      await this.redis.del(`refresh_token:${userId}`);
    } catch {
      this.logger.warn(
        'Redis unavailable during logout; refresh token may not be cleared.',
      );
    }
    return { message: 'Logged out successfully' };
  }

  async googleLogin(googleUser: any) {
    this.validateEmailDomain(googleUser.email);

    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
          avatarUrl: user.avatarUrl || googleUser.avatarUrl,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async googleMobileLogin(idToken: string) {
    // Validate token with Google tokeninfo endpoint (simple and reliable for mobile).
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const data: any = await res.json();
    const email = data?.email;
    const emailVerified = data?.email_verified;

    if (!email || (emailVerified !== true && emailVerified !== 'true')) {
      throw new UnauthorizedException('Google email not verified');
    }

    const googleUser = {
      googleId: data?.sub,
      email,
      name: data?.name || '',
      avatarUrl: data?.picture,
    };

    return this.googleLogin(googleUser);
  }

  private async generateTokens(userId: string, email: string) {
    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') || 'fallback';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'fallback';
    const accessExpiration =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email } as any,
        {
          secret: accessSecret,
          expiresIn: accessExpiration,
        } as any,
      ),
      this.jwtService.signAsync(
        { sub: userId, email } as any,
        {
          secret: refreshSecret,
          expiresIn: refreshExpiration,
        } as any,
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    // Store refresh token in Redis with 7-day expiry
    try {
      await this.redis.set(
        `refresh_token:${userId}`,
        token,
        'EX',
        7 * 24 * 60 * 60,
      );
    } catch {
      this.logger.warn('Redis unavailable; refresh token will not persist.');
    }
  }
}
