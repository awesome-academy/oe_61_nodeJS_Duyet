import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import {
  Roles,
  CreateRoomDto,
  UpdateRoomDto,
  FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from '@app/common';
import { firstValueFrom } from 'rxjs';
import { ParseId } from '@app/common/decorators/parse-id.decorator';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Room } from '@app/database';

@Controller('admin/rooms')
@Roles('admin', 'staff')
export class AdminRoomController {
  constructor(
    @Inject('UPLOAD_SERVICE') private readonly uploadClient: ClientProxy,
    @Inject('ROOM_SERVICE') private readonly roomClient: ClientProxy,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FILE_SIZE }),
          new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';

    try {
      let imageUrl: string | null = null;
      if (image) {
        const result = await firstValueFrom<{ url: string }>(
          this.uploadClient.send('upload_image', {
            file: image,
          }),
        );
        imageUrl = result.url;
      }
      const newRoom = await firstValueFrom<Room>(
        this.roomClient.send(
          { cmd: 'create_room' },
          { createRoomDto, lang, imageUrl },
        ),
      );

      return {
        status: true,
        message: this.i18n.t('room.CREATED_SUCCESS', { lang }),
        data: newRoom,
      };
    } catch (error) {
      const err = error as Error;
      return {
        status: false,
        message: err.message || this.i18n.t('room.CREATE_FAILED', { lang }),
      };
    }
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateRoom(
    @ParseId('id') id: number,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: FILE_SIZE }),
          new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';
    try {
      let imageUrl: string | null = null;

      if (image) {
        const result = await firstValueFrom<{ url: string }>(
          this.uploadClient.send('upload_image', { file: image }),
        );
        imageUrl = result.url;
      }

      const room = await firstValueFrom<Room>(
        this.roomClient.send(
          { cmd: 'update_room_info' },
          { id, updateRoomDto: { ...updateRoomDto, image: imageUrl }, lang },
        ),
      );

      return {
        status: true,
        message: this.i18n.t('room.UPDATED_SUCCESS', { lang }),
        data: room,
      };
    } catch (error) {
      const err = error as Error;
      return {
        status: false,
        message: err.message || this.i18n.t('room.UPDATE_FAILED', { lang }),
      };
    }
  }

  @Delete(':id')
  async deleteRoom(@ParseId('id') id: number) {
    const lang = I18nContext.current()?.lang || 'vi';

    try {
      const room = await firstValueFrom<Room>(
        this.roomClient.send({ cmd: 'delete_room' }, { id, lang }),
      );

      return {
        status: true,
        message: this.i18n.t('room.DELETED_SUCCESS', { lang }),
        data: room,
      };
    } catch (error) {
      const err = error as Error;
      throw new HttpException(
        {
          status: false,
          message: this.i18n.t('room.DELETE_FAILED', { lang }),
          error: err.message || String(error),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
