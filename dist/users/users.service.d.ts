import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: string): Promise<{
        name: string;
        email: string;
        id: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<{
        name: string;
        email: string;
        id: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        name: string;
        email: string;
        id: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    savePushToken(userId: string, pushToken: string): Promise<{
        id: string;
    }>;
}
