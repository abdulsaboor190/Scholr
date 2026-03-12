import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
declare class SavePushTokenDto {
    pushToken: string;
}
export declare class UsersController {
    private usersService;
    private cloudinaryService;
    constructor(usersService: UsersService, cloudinaryService: CloudinaryService);
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
    savePushToken(userId: string, dto: SavePushTokenDto): Promise<{
        id: string;
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        name: string;
        email: string;
        id: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
}
export {};
