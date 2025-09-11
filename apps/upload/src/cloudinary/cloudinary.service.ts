import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { RpcException } from '@nestjs/microservices';

// Định nghĩa một kiểu dữ liệu cho đối tượng file đã được tuần tự hóa
// mà UploadService nhận được từ Gateway
interface SerializedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: {
    type: 'Buffer';
    data: number[];
  };
  size: number;
}

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: SerializedFile, // Mong đợi nhận được đối tượng file đã được tuần tự hóa
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      // TÁI TẠO LẠI BUFFER từ mảng data
      const buffer = Buffer.from(file.buffer.data);

      const upload = cloudinary.uploader.upload_stream((error, result) => {
        if (error) {
          return reject(
            new RpcException({ message: error.message, status: 500 }),
          );
        }

        if (!result) {
          return reject(
            new RpcException({
              message: 'Cloudinary upload failed without an error.',
              status: 500,
            }),
          );
        }

        resolve(result);
      });

      // Truyền buffer đã được tái tạo vào stream upload
      upload.end(buffer);
    });
  }
}
