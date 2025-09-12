/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RpcException } from '@nestjs/microservices';
import { ListRoomDto } from '@app/common/dto/list-room.dto';
import { CreateRoomDto, UpdateRoomDto } from '@app/common';

const mockRoomService = {
  listRooms: jest.fn(),
  createRoom: jest.fn(),
  updateRoomInfo: jest.fn(),
  updateRoomImage: jest.fn(),
  deleteRoom: jest.fn(),
};

describe('RoomController', () => {
  let controller: RoomController;
  let service: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    service = module.get<RoomService>(RoomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ================================
  // listRooms
  // ================================
  describe('listRooms', () => {
    it('should call service.listRooms with dto', async () => {
      const dto: ListRoomDto = { page: 1, limit: 10 };
      const result = { data: [], total: 0, page: 1, last_page: 0 };
      mockRoomService.listRooms.mockResolvedValue(result);

      const res = await controller.listRooms(dto);
      expect(res).toEqual(result);
      expect(service.listRooms).toHaveBeenCalledWith(dto);
    });

    it('should throw RpcException when service fails', async () => {
      const dto: ListRoomDto = { page: 1, limit: 10 };
      const error = new RpcException('DB error');
      mockRoomService.listRooms.mockRejectedValue(error);

      await expect(controller.listRooms(dto)).rejects.toThrow(error);
    });
  });

  // ================================
  // createRoom
  // ================================
  describe('createRoom', () => {
    it('should call service.createRoom with payload', async () => {
      const payload = {
        createRoomDto: { room_number: '101' } as CreateRoomDto,
        lang: 'en',
        imageUrl: 'http://image',
      };
      const result = { id: 1, ...payload.createRoomDto };
      mockRoomService.createRoom.mockResolvedValue(result);

      const res = await controller.createRoom(payload);
      expect(res).toEqual(result);
      expect(service.createRoom).toHaveBeenCalledWith(payload);
    });

    it('should propagate error from service', async () => {
      const payload = {
        createRoomDto: { room_number: '101' } as CreateRoomDto,
        lang: 'en',
        imageUrl: null,
      };
      const error = new RpcException('Create failed');
      mockRoomService.createRoom.mockRejectedValue(error);

      await expect(controller.createRoom(payload)).rejects.toThrow(error);
    });
  });

  // ================================
  // handleUpdateRoomInfo
  // ================================
  describe('handleUpdateRoomInfo', () => {
    it('should call service.updateRoomInfo with id, dto and lang', async () => {
      const payload = {
        id: 1,
        updateRoomDto: { room_number: '202' } as UpdateRoomDto,
        lang: 'en',
      };
      const result = { id: 1, ...payload.updateRoomDto };
      mockRoomService.updateRoomInfo.mockResolvedValue(result);

      const res = await controller.handleUpdateRoomInfo(payload);
      expect(res).toEqual(result);
      expect(service.updateRoomInfo).toHaveBeenCalledWith(
        payload.id,
        payload.updateRoomDto,
        payload.lang,
      );
    });

    it('should propagate error from service', async () => {
      const payload = {
        id: 1,
        updateRoomDto: {} as UpdateRoomDto,
        lang: 'en',
      };
      const error = new RpcException('Update failed');
      mockRoomService.updateRoomInfo.mockRejectedValue(error);

      await expect(controller.handleUpdateRoomInfo(payload)).rejects.toThrow(
        error,
      );
    });
  });

  // ================================
  // handleUpdateRoomImage
  // ================================
  describe('handleUpdateRoomImage', () => {
    it('should call service.updateRoomImage with roomId and imageUrl', () => {
      const payload = { roomId: 1, imageUrl: 'http://image' };
      controller.handleUpdateRoomImage(payload);

      expect(service.updateRoomImage).toHaveBeenCalledWith(
        payload.roomId,
        payload.imageUrl,
      );
    });
  });

  // ================================
  // handleDeleteRoom
  // ================================
  describe('handleDeleteRoom', () => {
    it('should call service.deleteRoom with id and lang', async () => {
      const payload = { id: 1, lang: 'en' };
      const result = { success: true };
      mockRoomService.deleteRoom.mockResolvedValue(result);

      const res = await controller.handleDeleteRoom(payload);
      expect(res).toEqual(result);
      expect(service.deleteRoom).toHaveBeenCalledWith(payload.id, payload.lang);
    });

    it('should propagate error from service', async () => {
      const payload = { id: 1, lang: 'en' };
      const error = new RpcException('Delete failed');
      mockRoomService.deleteRoom.mockRejectedValue(error);

      await expect(controller.handleDeleteRoom(payload)).rejects.toThrow(error);
    });
  });
});
