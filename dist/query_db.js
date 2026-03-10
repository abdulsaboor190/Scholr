"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'john@university.edu' }
    });
    console.log('User found:', user);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
//# sourceMappingURL=query_db.js.map