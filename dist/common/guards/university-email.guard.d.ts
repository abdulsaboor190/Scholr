import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class UniversityEmailGuard implements CanActivate {
    private configService;
    private allowedDomains;
    constructor(configService: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
