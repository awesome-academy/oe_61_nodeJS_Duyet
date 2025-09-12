/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { ClientProxy } from '@nestjs/microservices';
import { UploadPayload } from '@app/common';
import { UploadApiResponse } from 'cloudinary';

// 1. Mock the dependencies
const mockCloudinaryService = {
  uploadImage: jest.fn(),
};
const mockRoomClient = {
  emit: jest.fn(),
};

describe('UploadController', () => {
  let controller: UploadController;
  let cloudinaryService: CloudinaryService;
  let roomClient: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: 'ROOM_SERVICE', useValue: mockRoomClient },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
    roomClient = module.get<ClientProxy>('ROOM_SERVICE');
  });

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Test Suite for 'handleUploadRoomImage' ---
  describe('handleUploadRoomImage', () => {
    const mockPayload: UploadPayload = {
      file: {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: {
          type: 'Buffer',
          data: [1, 2, 3], // Mock buffer data
        },
        size: 12345,
      },
      roomId: 1,
    };

    // --- Scenario 1: Successful Upload ---
    it('should upload image and emit an update event on success', async () => {
      // Arrange: Mock the cloudinary service to return a successful response
      const mockUploadResponse = {
        secure_url: 'http://res.cloudinary.com/test/image.jpg',
        public_id: 'test_public_id',
      } as UploadApiResponse;
      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResponse);

      // Act: Call the handler
      await controller.handleUploadRoomImage(mockPayload);

      // Assert: Check that the services were called correctly
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockPayload.file,
      );
      expect(roomClient.emit).toHaveBeenCalledWith('update_room_image', {
        roomId: mockPayload.roomId,
        imageUrl: mockUploadResponse.secure_url,
      });
    });

    // --- Scenario 2: Invalid Payload (Missing buffer data) ---
    it('should log an error and not proceed if payload is invalid', async () => {
      // Arrange: Create a payload with missing buffer data.
      const invalidPayload = {
        ...mockPayload,
        file: {
          ...mockPayload.file,
          buffer: undefined,
        },
      } as unknown as UploadPayload;

      // Act: Call the handler
      await controller.handleUploadRoomImage(invalidPayload);

      // Assert: Check that external services were NOT called
      expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(roomClient.emit).not.toHaveBeenCalled();
    });

    // --- Scenario 3: Cloudinary Service returns an error object ---
    it('should log an error and not emit if cloudinary returns an error response', async () => {
      // Arrange: Mock the cloudinary service to return a structured error
      const mockErrorResponse = {
        message: 'Invalid cloud name',
        name: 'Error',
      };
      mockCloudinaryService.uploadImage.mockResolvedValue(
        mockErrorResponse as any,
      );

      // Act: Call the handler
      await controller.handleUploadRoomImage(mockPayload);

      // Assert
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockPayload.file,
      );
      expect(roomClient.emit).not.toHaveBeenCalled();
    });

    // --- Scenario 4: Cloudinary Service throws an exception ---
    it('should log an error and not emit if cloudinaryService.uploadImage throws', async () => {
      // Arrange: Mock the cloudinary service to throw a technical error
      const error = new Error('Connection failed');
      mockCloudinaryService.uploadImage.mockRejectedValue(error);

      // Act: Call the handler
      await controller.handleUploadRoomImage(mockPayload);

      // Assert
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockPayload.file,
      );
      expect(roomClient.emit).not.toHaveBeenCalled();
    });
  });
});
