"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorrowHistoryModule = void 0;
const common_1 = require("@nestjs/common");
const borrow_history_service_1 = require("./borrow-history.service");
const borrow_history_controller_1 = require("./borrow-history.controller");
let BorrowHistoryModule = class BorrowHistoryModule {
};
exports.BorrowHistoryModule = BorrowHistoryModule;
exports.BorrowHistoryModule = BorrowHistoryModule = __decorate([
    (0, common_1.Module)({
        controllers: [borrow_history_controller_1.BorrowHistoryController],
        providers: [borrow_history_service_1.BorrowHistoryService],
    })
], BorrowHistoryModule);
//# sourceMappingURL=borrow-history.module.js.map