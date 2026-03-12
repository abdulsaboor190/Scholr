import { UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    uploadImage(file: Express.Multer.File, folder?: string): Promise<UploadApiResponse>;
    deleteImage(publicId: string): Promise<void>;
}
