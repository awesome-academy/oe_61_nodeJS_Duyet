import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
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
import { Roles, CreateRoomDto, UpdateRoomDto } from '@app/common';
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
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';

    // FIX: Specify the expected return type for firstValueFrom
    const newRoom = await firstValueFrom<Room>(
      this.roomClient.send(
        { cmd: 'create_room' },
        { createRoomDto, lang, imageUrl: null },
      ),
    );

    if (image) {
      this.uploadClient.emit('upload_room_image', {
        file: image,
        roomId: newRoom.id,
      });
    }

    return {
      status: true,
      message: this.i18n.t('room.CREATED_SUCCESS', { lang }),
      data: newRoom,
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateRoom(
    @ParseId('id') id: number,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    image?: Express.Multer.File,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';
    if (image) {
      this.uploadClient.emit('upload_room_image', {
        file: image,
        roomId: id,
      });
    }

    const room = await firstValueFrom<Room>(
      this.roomClient.send(
        { cmd: 'update_room_info' },
        { id, updateRoomDto, lang },
      ),
    );

    return {
      status: true,
      message: this.i18n.t('room.UPDATED_SUCCESS', { lang }),
      data: room,
    };
  }

  @Delete(':id')
  async deleteRoom(@ParseId('id') id: number) {
    const lang = I18nContext.current()?.lang || 'vi';
    const payload = { id, lang };
    const room = await firstValueFrom<Room>(
      this.roomClient.send({ cmd: 'delete_room' }, payload),
    );

    return {
      status: true,
      message: this.i18n.t('room.DELETED_SUCCESS', { lang }),
      data: room,
    };
  }
}
