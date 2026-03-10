"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversityEmailGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let UniversityEmailGuard = class UniversityEmailGuard {
    configService;
    allowedDomains;
    constructor(configService) {
        this.configService = configService;
        const domains = this.configService.get('ALLOWED_EMAIL_DOMAINS', 'university.edu');
        this.allowedDomains = domains.split(',').map((d) => d.trim().toLowerCase());
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const email = request.body?.email || request.user?.email;
        if (!email) {
            throw new common_1.ForbiddenException('Email is required');
        }
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain || !this.allowedDomains.includes(emailDomain)) {
            throw new common_1.ForbiddenException(`Only university email addresses are allowed (${this.allowedDomains.join(', ')})`);
        }
        return true;
    }
};
exports.UniversityEmailGuard = UniversityEmailGuard;
exports.UniversityEmailGuard = UniversityEmailGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UniversityEmailGuard);
//# sourceMappingURL=university-email.guard.js.map