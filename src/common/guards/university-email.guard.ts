import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UniversityEmailGuard implements CanActivate {
  private allowedDomains: string[];

  constructor(private configService: ConfigService) {
    const domains = this.configService.get<string>(
      'ALLOWED_EMAIL_DOMAINS',
      'university.edu',
    );
    this.allowedDomains = domains.split(',').map((d) => d.trim().toLowerCase());
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const email: string = request.body?.email || request.user?.email;

    if (!email) {
      throw new ForbiddenException('Email is required');
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!emailDomain || !this.allowedDomains.includes(emailDomain)) {
      throw new ForbiddenException(
        `Only university email addresses are allowed (${this.allowedDomains.join(', ')})`,
      );
    }

    return true;
  }
}
