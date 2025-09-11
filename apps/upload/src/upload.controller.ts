import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { UploadPayload } from '@app/common';

@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @Inject('ROOM_SERVICE') private readonly roomClient: ClientProxy,
  ) {}

  @EventPattern('upload_room_image') // Listen to events from Gateway
  async handleUploadRoomImage(@Payload() payload: UploadPayload) {
    const { file, roomId } = payload;

    if (!file || !file.buffer || !file.buffer.data) {
      this.logger.error(
        `Received invalid file payload for roomId: ${roomId}. Aborting upload.`,
      );
      return;
    }

    try {
      const result = await this.cloudinaryService.uploadImage(file);

      if ('secure_url' in result) {
        const uploadResult = result as UploadApiResponse;
        this.roomClient.emit('update_room_image', {
          roomId: roomId,
          imageUrl: uploadResult.secure_url,
        });
        this.logger.log(
          `Successfully processed image for roomId: ${roomId}. URL: ${uploadResult.secure_url}`,
        );
      } else {
        this.logger.error(
          `Cloudinary upload failed for roomId: ${roomId}`,
          result,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload image for roomId: ${roomId}`,
        (error as Error).stack,
      );
    }
  }
}
