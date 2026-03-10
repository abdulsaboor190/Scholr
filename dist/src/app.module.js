"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const books_module_1 = require("./books/books.module");
const borrow_requests_module_1 = require("./borrow-requests/borrow-requests.module");
const borrow_history_module_1 = require("./borrow-history/borrow-history.module");
const chats_module_1 = require("./chats/chats.module");
const reviews_module_1 = require("./reviews/reviews.module");
const reports_module_1 = require("./reports/reports.module");
const admin_module_1 = require("./admin/admin.module");
const queue_module_1 = require("./queue/queue.module");
const notifications_module_1 = require("./notifications/notifications.module");
const guards_1 = require("./common/guards");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            queue_module_1.QueueModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            books_module_1.BooksModule,
            borrow_requests_module_1.BorrowRequestsModule,
            borrow_history_module_1.BorrowHistoryModule,
            chats_module_1.ChatsModule,
            notifications_module_1.NotificationsModule,
            reviews_module_1.ReviewsModule,
            reports_module_1.ReportsModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map