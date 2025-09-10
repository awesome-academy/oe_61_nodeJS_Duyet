/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RpcException } from '@nestjs/microservices';
import { ListRoomDto } from '@app/common/dto/list-room.dto';

// 1. Create a mock for the RoomService
// This helps to isolate and test only the RoomController's logic
const mockRoomService = {
  listRooms: jest.fn(),
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
          useValue: mockRoomService, // Use the mock service
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    service = module.get<RoomService>(RoomService);
  });

  // Clean up mocks after each test to ensure test isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test suite for the 'listRooms' handler ---
  describe('listRooms', () => {
    // --- Scenario 1: Default parameters ---
    it('should call the service with default pagination when no params are provided', async () => {
      const defaultDto: ListRoomDto = { page: 1, limit: 10 };
      const successResponse = { data: [], total: 0, page: 1, last_page: 0 };
      mockRoomService.listRooms.mockResolvedValue(successResponse);

      await controller.listRooms(defaultDto);

      // Assert: Check if the service was called with the correct default DTO
      expect(service.listRooms).toHaveBeenCalledWith(defaultDto);
    });

    // --- Scenario 2: With pagination parameters ---
    it('should call the service with provided pagination parameters', async () => {
      const paginationDto: ListRoomDto = { page: 3, limit: 25 };
      mockRoomService.listRooms.mockResolvedValue({}); // Response doesn't matter for this check

      await controller.listRooms(paginationDto);

      // Assert: Check if the service was called with the exact pagination DTO
      expect(service.listRooms).toHaveBeenCalledWith(paginationDto);
    });

    // --- Scenario 3: With search and filter parameters ---
    it('should call the service with search and filter parameters', async () => {
      const filterDto: ListRoomDto = {
        search: 'beach view',
        bed_number: 2,
        air_conditioned: true,
      };
      mockRoomService.listRooms.mockResolvedValue({});

      await controller.listRooms(filterDto);

      // Assert: Check if the service was called with the exact filter DTO
      expect(service.listRooms).toHaveBeenCalledWith(filterDto);
    });

    // --- Scenario 4: With a combination of all parameters ---
    it('should call the service with a full combination of parameters', async () => {
      const fullDto: ListRoomDto = {
        page: 2,
        limit: 15,
        search: 'deluxe',
        bed_number: 1,
        air_conditioned: false,
      };
      mockRoomService.listRooms.mockResolvedValue({});

      await controller.listRooms(fullDto);

      // Assert: Check if the service was called with the complete DTO
      expect(service.listRooms).toHaveBeenCalledWith(fullDto);
    });

    // --- Scenario 5: Successful operation with response check ---
    it('should return the result from the service on a successful call', async () => {
      const listRoomDto: ListRoomDto = { page: 1, limit: 10 };
      const successResponse = {
        data: [{ id: 1, room_number: '101' }],
        total: 1,
        page: 1,
        last_page: 1,
      };
      mockRoomService.listRooms.mockResolvedValue(successResponse);

      const result = await controller.listRooms(listRoomDto);

      // Assert: Did the controller return the correct result from the service?
      expect(result).toEqual(successResponse);
    });

    // --- Scenario 6: Service throws an error ---
    it('should propagate RpcException when the service throws an error', async () => {
      const listRoomDto: ListRoomDto = { page: 1, limit: 10 };
      const rpcError = new RpcException('Database connection failed');
      mockRoomService.listRooms.mockRejectedValue(rpcError);

      // Act & Assert: Expect that calling the method will throw the exact error from the service
      await expect(controller.listRooms(listRoomDto)).rejects.toThrow(rpcError);
    });
  });
});
