/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminRoomController } from './admin-room.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateRoomDto,
  JwtAuthGuard,
  RolesGuard,
  UpdateRoomDto,
} from '@app/common';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock clients + i18n service
const mockUploadClient = { send: jest.fn() };
const mockRoomClient = { send: jest.fn() };
const mockI18nService = {
  t: jest.fn().mockImplementation((key) => `translated.${key}`),
};

describe('AdminRoomController', () => {
  let controller: AdminRoomController;
  let uploadClient: ClientProxy;
  let roomClient: ClientProxy;
  let i18nService: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRoomController],
      providers: [
        { provide: 'ROOM_SERVICE', useValue: mockRoomClient },
        { provide: 'UPLOAD_SERVICE', useValue: mockUploadClient },
        { provide: I18nService, useValue: mockI18nService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AdminRoomController>(AdminRoomController);
    roomClient = module.get<ClientProxy>('ROOM_SERVICE');
    uploadClient = module.get<ClientProxy>('UPLOAD_SERVICE');
    i18nService = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should use i18nService to translate keys', () => {
    const translated = i18nService.t('validation.IS_STRING');
    expect(translated).toBe('translated.validation.IS_STRING');
  });

  // --- createRoom ---
  describe('createRoom', () => {
    const createRoomDto = { room_number: '101' } as CreateRoomDto;
    const mockImage = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;
    const newRoomResponse = { id: 1, ...createRoomDto };

    it('should create a room and upload image when image provided', async () => {
      mockRoomClient.send.mockReturnValue(of(newRoomResponse));
      mockUploadClient.send.mockReturnValue(of({ url: 'http://image.url' }));

      const result = await controller.createRoom(createRoomDto, mockImage);

      expect(roomClient.send).toHaveBeenCalledWith(
        { cmd: 'create_room' },
        expect.objectContaining({
          createRoomDto,
          lang: 'vi',
          imageUrl: 'http://image.url',
        }),
      );
      expect(uploadClient.send).toHaveBeenCalledWith('upload_image', {
        file: mockImage,
      });
      expect(result.status).toBe(true);
      expect(result.data).toEqual(newRoomResponse);
    });

    it('should create a room without uploading image when no image', async () => {
      mockRoomClient.send.mockReturnValue(of(newRoomResponse));

      const result = await controller.createRoom(createRoomDto, undefined);

      expect(roomClient.send).toHaveBeenCalled();
      expect(uploadClient.send).not.toHaveBeenCalled();
      expect(result.status).toBe(true);
    });

    it('should return status false when room creation fails', async () => {
      mockRoomClient.send.mockReturnValue(throwError(() => new Error('fail')));

      const result = await controller.createRoom(createRoomDto);

      expect(result.status).toBe(false);
      expect(result.message).toContain('fail');
    });

    // validation
    describe('validation', () => {
      const createDto = (data: unknown): CreateRoomDto =>
        plainToInstance(CreateRoomDto, data);

      const validData = {
        room_number: '101',
        bed_number: 2,
        air_conditioned: true,
        view: 'Sea View',
        room_type_id: 1,
        price: 200,
      };

      it('should pass with valid data', async () => {
        const dto = createDto(validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail if room_number empty', async () => {
        const dto = createDto({ ...validData, room_number: '' });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'room_number')).toBeTruthy();
      });

      it('should fail if bed_number not integer', async () => {
        const dto = createDto({ ...validData, bed_number: 1.5 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'bed_number')).toBeTruthy();
      });

      it('should fail if air_conditioned not boolean', async () => {
        const dto = createDto({ ...validData, air_conditioned: 'abc' });
        const errors = await validate(dto);
        expect(
          errors.some((e) => e.property === 'air_conditioned'),
        ).toBeTruthy();
      });

      it('should fail if price negative', async () => {
        const dto = createDto({ ...validData, price: -100 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'price')).toBeTruthy();
      });
    });
  });

  // --- updateRoom ---
  describe('updateRoom', () => {
    const updateRoomDto = { price: 1500 } as UpdateRoomDto;
    const mockImage = {
      originalname: 'new.jpg',
      buffer: Buffer.from('new'),
    } as Express.Multer.File;
    const roomId = 1;
    const updatedRoomResponse = { id: roomId, ...updateRoomDto };

    it('should update room info and upload image if provided', async () => {
      mockUploadClient.send.mockReturnValue(of({ url: 'http://image.url' }));
      mockRoomClient.send.mockReturnValue(of(updatedRoomResponse));

      const result = await controller.updateRoom(
        roomId,
        updateRoomDto,
        mockImage,
      );

      expect(uploadClient.send).toHaveBeenCalledWith('upload_image', {
        file: mockImage,
      });
      expect(roomClient.send).toHaveBeenCalledWith(
        { cmd: 'update_room_info' },
        {
          id: roomId,
          updateRoomDto: { ...updateRoomDto, image: 'http://image.url' },
          lang: 'vi',
        },
      );
      expect(result.status).toBe(true);
    });

    it('should update room info without image', async () => {
      mockRoomClient.send.mockReturnValue(of(updatedRoomResponse));

      const result = await controller.updateRoom(
        roomId,
        updateRoomDto,
        undefined,
      );

      expect(uploadClient.send).not.toHaveBeenCalled();
      expect(result.status).toBe(true);
    });

    it('should return status false when update fails', async () => {
      mockRoomClient.send.mockReturnValue(
        throwError(() => new Error('update fail')),
      );

      const result = await controller.updateRoom(roomId, updateRoomDto);

      expect(result.status).toBe(false);
      expect(result.message).toContain('update fail');
    });
  });

  // --- deleteRoom ---
  describe('deleteRoom', () => {
    const roomId = 1;

    it('should delete room successfully', async () => {
      const deleteResponse = { affected: 1 };
      mockRoomClient.send.mockReturnValue(of(deleteResponse));

      const result = await controller.deleteRoom(roomId);

      expect(roomClient.send).toHaveBeenCalledWith(
        { cmd: 'delete_room' },
        { id: roomId, lang: 'vi' },
      );
      expect(result.status).toBe(true);
      expect(result.data).toEqual(deleteResponse);
    });

    it('should throw HttpException when deletion fails', async () => {
      mockRoomClient.send.mockReturnValue(
        throwError(() => new Error('not found')),
      );

      await expect(controller.deleteRoom(roomId)).rejects.toThrow(
        HttpException,
      );

      try {
        await controller.deleteRoom(roomId);
      } catch (err) {
        const httpErr = err as HttpException; // ép kiểu
        expect(httpErr).toBeInstanceOf(HttpException);
        expect(httpErr.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });
});
