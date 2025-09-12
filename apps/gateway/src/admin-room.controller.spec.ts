/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminRoomController } from './admin-room.controller';
import { ClientProxy, RpcException } from '@nestjs/microservices';
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

// Mock clients + i18n service
const mockUploadClient = { emit: jest.fn() };
const mockRoomClient = { send: jest.fn(), emit: jest.fn() };
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

  // --- Test Suite for 'createRoom' ---
  describe('createRoom', () => {
    const createRoomDto = { room_number: '101' } as CreateRoomDto;
    const mockImage = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;
    const newRoomResponse = { id: 1, ...createRoomDto };

    it('should create a room and emit an upload event when an image is provided', async () => {
      mockRoomClient.send.mockReturnValue(of(newRoomResponse));

      const result = await controller.createRoom(createRoomDto, mockImage);

      expect(roomClient.send).toHaveBeenCalledWith(
        { cmd: 'create_room' },
        expect.objectContaining({ createRoomDto, lang: 'vi' }),
      );
      expect(uploadClient.emit).toHaveBeenCalledWith('upload_room_image', {
        file: mockImage,
        roomId: newRoomResponse.id,
      });
      expect(result.data).toEqual(newRoomResponse);
    });

    it('should create a room without emitting an upload event if no image is provided', async () => {
      mockRoomClient.send.mockReturnValue(of(newRoomResponse));

      await controller.createRoom(createRoomDto, undefined);

      expect(roomClient.send).toHaveBeenCalled();
      expect(uploadClient.emit).not.toHaveBeenCalled();
    });

    it('should propagate RpcException if room creation fails', async () => {
      const rpcError = new RpcException('Room already exists');
      mockRoomClient.send.mockReturnValue(throwError(() => rpcError));

      await expect(controller.createRoom(createRoomDto)).rejects.toThrow(
        rpcError,
      );
      expect(uploadClient.emit).not.toHaveBeenCalled();
    });

    describe('validation', () => {
      const createDto = (data: unknown): CreateRoomDto => {
        return plainToInstance(CreateRoomDto, data);
      };

      const validData = {
        room_number: '101',
        bed_number: 2,
        air_conditioned: true,
        view: 'Sea View',
        room_type_id: 1,
        price: 200,
      };

      it('should pass validation with correct data', async () => {
        const dto = createDto(validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail if room_number is empty', async () => {
        const dto = createDto({ ...validData, room_number: '' });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'room_number')).toBeTruthy();
      });

      it('should fail if bed_number is not an integer', async () => {
        const dto = createDto({ ...validData, bed_number: 1.5 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'bed_number')).toBeTruthy();
      });

      it('should fail if air_conditioned is not a boolean', async () => {
        const dto = createDto({
          ...validData,
          air_conditioned: 'not_a_boolean',
        });
        const errors = await validate(dto);
        expect(
          errors.some((e) => e.property === 'air_conditioned'),
        ).toBeTruthy();
      });

      it('should fail if price is a negative number', async () => {
        const dto = createDto({ ...validData, price: -100 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'price')).toBeTruthy();
      });
    });
  });

  // --- Test Suite for 'updateRoom' ---
  describe('updateRoom', () => {
    const updateRoomDto = { price: 1500000 } as UpdateRoomDto;
    const mockImage = {
      originalname: 'new.jpg',
      buffer: Buffer.from('new'),
    } as Express.Multer.File;
    const roomId = 1;
    const updatedRoomResponse = { id: roomId, ...updateRoomDto };

    it('should update room info and upload image when an image is provided', async () => {
      mockRoomClient.send.mockReturnValue(of(updatedRoomResponse));

      const result = await controller.updateRoom(
        roomId,
        updateRoomDto,
        mockImage,
      );

      expect(roomClient.send).toHaveBeenCalledWith(
        { cmd: 'update_room_info' },
        { id: roomId, updateRoomDto, lang: 'vi' },
      );
      expect(uploadClient.emit).toHaveBeenCalledWith('upload_room_image', {
        file: mockImage,
        roomId,
      });
      expect(result.status).toBe(true);
    });

    it('should only update room info when no image is provided', async () => {
      mockRoomClient.send.mockReturnValue(of(updatedRoomResponse));

      await controller.updateRoom(roomId, updateRoomDto, undefined);

      expect(roomClient.send).toHaveBeenCalledTimes(1);
      expect(uploadClient.emit).not.toHaveBeenCalled();
    });

    describe('validation', () => {
      const createUpdateDto = (data: unknown): UpdateRoomDto => {
        return plainToInstance(UpdateRoomDto, data);
      };

      it('should pass validation even with an empty object (all fields are optional)', async () => {
        const dto = createUpdateDto({});
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail if bed_number is provided but is not an integer', async () => {
        const dto = createUpdateDto({ bed_number: 'not-a-number' });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'bed_number')).toBeTruthy();
      });

      it('should fail if air_conditioned is provided but is not a boolean', async () => {
        const dto = createUpdateDto({ air_conditioned: 'maybe' });
        const errors = await validate(dto);
        expect(
          errors.some((e) => e.property === 'air_conditioned'),
        ).toBeTruthy();
      });

      it('should fail if price is provided but is a negative number', async () => {
        const dto = createUpdateDto({ price: -50 });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'price')).toBeTruthy();
      });
    });
  });

  // --- Test Suite for 'deleteRoom' ---
  describe('deleteRoom', () => {
    const roomId = 1;

    it('should send a "delete_room" message and return a success response', async () => {
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

    it('should propagate RpcException if deletion fails', async () => {
      const rpcError = new RpcException('Room not found');
      mockRoomClient.send.mockReturnValue(throwError(() => rpcError));

      await expect(controller.deleteRoom(roomId)).rejects.toThrow(rpcError);
    });
  });
});
