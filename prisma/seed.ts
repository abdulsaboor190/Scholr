import 'dotenv/config';
import { PrismaClient, BookStatus, BorrowRequestStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookshare';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data
    await prisma.chat.deleteMany();
    await prisma.review.deleteMany();
    await prisma.borrowRequest.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create test user
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

    // Create 3 books owned by user1
    const book1 = await prisma.book.create({
        data: {
            title: 'Introduction to Algorithms',
            author: 'Thomas H. Cormen',
            subject: 'Computer Science',
            status: BookStatus.AVAILABLE,
            ownerId: user1.id,
        },
    });

    const book2 = await prisma.book.create({
        data: {
            title: 'Clean Code',
            author: 'Robert C. Martin',
            subject: 'Software Engineering',
            status: BookStatus.AVAILABLE,
            ownerId: user1.id,
        },
    });

    const book3 = await prisma.book.create({
        data: {
            title: 'Design Patterns',
            author: 'Gang of Four',
            subject: 'Software Engineering',
            status: BookStatus.BORROWED,
            ownerId: user1.id,
        },
    });

    console.log('📚 Created 3 books');

    // Create 2 borrow requests from user2
    const request1 = await prisma.borrowRequest.create({
        data: {
            bookId: book1.id,
            requesterId: user2.id,
            status: BorrowRequestStatus.PENDING,
        },
    });

    const request2 = await prisma.borrowRequest.create({
        data: {
            bookId: book3.id,
            requesterId: user2.id,
            status: BorrowRequestStatus.ACCEPTED,
        },
    });

    console.log('📋 Created 2 borrow requests');



    // Create a review
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
