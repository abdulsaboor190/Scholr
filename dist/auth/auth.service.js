"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const ioredis_1 = require("ioredis");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    redis;
    logger = new common_1.Logger(AuthService_1.name);
    allowedDomains;
    constructor(prisma, jwtService, configService, redis) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redis = redis;
        const domains = this.configService.get('ALLOWED_EMAIL_DOMAINS', 'nu.edu.pk,isb.nu.edu.pk');
        this.allowedDomains = domains.split(',').map((d) => d.trim().toLowerCase());
    }
    validateEmailDomain(email) {
        const [, domain] = email.split('@');
        const domainLower = domain?.toLowerCase();
        if (!domainLower || !this.allowedDomains.includes(domainLower)) {
            throw new common_1.ForbiddenException(`Only university emails are allowed (${this.allowedDomains.join(', ')})`);
        }
    }
    async register(dto) {
        try {
            this.validateEmailDomain(dto.email);
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
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
        }
        catch (e) {
            throw new common_1.ConflictException(`DEBUG ERROR: ${e.message} \n Stack: ${e.stack}`);
        }
    }
    async login(dto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (!user || !user.password) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = await bcrypt.compare(dto.password, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
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
        catch (e) {
            if (e instanceof common_1.UnauthorizedException)
                throw e;
            throw new common_1.InternalServerErrorException(`DEBUG ERROR LOGIN: ${e.message} \n Stack: ${e.stack}`);
        }
    }
    async adminLogin(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Admin access required');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async refreshTokens(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            let storedToken = null;
            try {
                storedToken = await this.redis.get(`refresh_token:${payload.sub}`);
            }
            catch {
                throw new common_1.UnauthorizedException('Refresh tokens are temporarily unavailable');
            }
            if (!storedToken || storedToken !== refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const tokens = await this.generateTokens(user.id, user.email);
            await this.storeRefreshToken(user.id, tokens.refreshToken);
            return tokens;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async logout(userId) {
        try {
            await this.redis.del(`refresh_token:${userId}`);
        }
        catch {
            this.logger.warn('Redis unavailable during logout; refresh token may not be cleared.');
        }
        return { message: 'Logged out successfully' };
    }
    async googleLogin(googleUser) {
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
        }
        else if (!user.googleId) {
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
    async googleMobileLogin(idToken) {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        const data = await res.json();
        if (!res.ok) {
            throw new common_1.UnauthorizedException(`Invalid Google token: ${JSON.stringify(data)}`);
        }
        const email = data?.email;
        const emailVerified = data?.email_verified;
        if (!email || (emailVerified !== true && emailVerified !== 'true')) {
            throw new common_1.UnauthorizedException('Google email not verified');
        }
        this.logger.log(`Google Mobile Login attempt: email=${email}`);
        try {
            this.validateEmailDomain(email);
        }
        catch (e) {
            throw new common_1.ForbiddenException(`Your Google account (${email}) is not a university email. Only ${this.allowedDomains.join(', ')} accounts are permitted.`);
        }
        const googleUser = {
            googleId: data?.sub,
            email,
            name: data?.name || email.split('@')[0],
            avatarUrl: data?.picture,
        };
        return this.googleLogin(googleUser);
    }
    async generateTokens(userId, email) {
        const accessSecret = this.configService.get('JWT_ACCESS_SECRET') || 'fallback';
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') || 'fallback';
        const accessExpiration = this.configService.get('JWT_ACCESS_EXPIRATION') || '15m';
        const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION') || '7d';
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: userId, email }, {
                secret: accessSecret,
                expiresIn: accessExpiration,
            }),
            this.jwtService.signAsync({ sub: userId, email }, {
                secret: refreshSecret,
                expiresIn: refreshExpiration,
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async storeRefreshToken(userId, token) {
        try {
            await this.redis.set(`refresh_token:${userId}`, token, 'EX', 7 * 24 * 60 * 60);
        }
        catch {
            this.logger.warn('Redis unavailable; refresh token will not persist.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        ioredis_1.Redis])
], AuthService);
//# sourceMappingURL=auth.service.js.map