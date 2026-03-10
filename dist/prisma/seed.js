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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcryptjs"));
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookshare';
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Starting seed...');
    await prisma.chat.deleteMany();
    await prisma.review.deleteMany();
    await prisma.borrowRequest.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing data');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user1 = await prisma.user.create({
        data: {
            name: 'John Doe',
            email: 'john@university.edu',
            password: hashedPassword,
            role: 'USER',
        },
    });
    const user2 = await prisma.user.create({
        data: {
            name: 'Jane Smith',
            email: 'jane@university.edu',
            password: hashedPassword,
            role: 'USER',
        },
    });
    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@university.edu',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('👤 Created users:', user1.name, '&', user2.name, '&', adminUser.name);
    const book1 = await prisma.book.create({
        data: {
            title: 'Introduction to Algorithms',
            author: 'Thomas H. Cormen',
            subject: 'Computer Science',
            status: client_1.BookStatus.AVAILABLE,
            ownerId: user1.id,
        },
    });
    const book2 = await prisma.book.create({
        data: {
            title: 'Clean Code',
            author: 'Robert C. Martin',
            subject: 'Software Engineering',
            status: client_1.BookStatus.AVAILABLE,
            ownerId: user1.id,
        },
    });
    const book3 = await prisma.book.create({
        data: {
            title: 'Design Patterns',
            author: 'Gang of Four',
            subject: 'Software Engineering',
            status: client_1.BookStatus.BORROWED,
            ownerId: user1.id,
        },
    });
    console.log('📚 Created 3 books');
    const request1 = await prisma.borrowRequest.create({
        data: {
            bookId: book1.id,
            requesterId: user2.id,
            status: client_1.BorrowRequestStatus.PENDING,
        },
    });
    const request2 = await prisma.borrowRequest.create({
        data: {
            bookId: book3.id,
            requesterId: user2.id,
            status: client_1.BorrowRequestStatus.ACCEPTED,
        },
    });
    console.log('📋 Created 2 borrow requests');
    await prisma.review.create({
        data: {
            transactionId: request2.id,
            revieweeId: user1.id,
            bookId: book3.id,
            reviewerId: user2.id,
            rating: 5,
            comment: 'Excellent book on design patterns. A must-read for every developer!',
        },
    });
    console.log('⭐ Created review');
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   User 1: john@university.edu / password123');
    console.log('   User 2: jane@university.edu / password123');
    console.log('   Admin:  admin@university.edu / password123');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map