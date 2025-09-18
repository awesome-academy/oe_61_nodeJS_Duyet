/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UploadPayload } from '@app/common';
import { UploadApiResponse } from 'cloudinary';

// 1. Mock the dependencies
const mockCloudinaryService = {
  uploadImage: jest.fn(),
};

describe('UploadController', () => {
  let controller: UploadController;
  let cloudinaryService: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: 'ROOM_SERVICE', useValue: {} }, // not used anymore
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
    jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});
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
    it('should upload image and return URL on success', async () => {
      // Arrange
      const mockUploadResponse = {
        secure_url: 'http://res.cloudinary.com/test/image.jpg',
        public_id: 'test_public_id',
      } as UploadApiResponse;
      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResponse);

      // Act
      const result = await controller.handleUploadRoomImage(mockPayload);

      // Assert
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockPayload.file,
      );
      expect(result).toEqual({ url: mockUploadResponse.secure_url });
    });

    // --- Scenario 2: Invalid Payload (Missing buffer data) ---
    it('should log an error and return undefined if payload is invalid', async () => {
      const invalidPayload = {
        ...mockPayload,
        file: {
          ...mockPayload.file,
          buffer: undefined,
        },
      } as unknown as UploadPayload;

      const result = await controller.handleUploadRoomImage(invalidPayload);

      expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    // --- Scenario 3: Cloudinary Service returns an error object ---
    it('should log an error and return undefined if cloudinary returns an error response', async () => {
      const mockErrorResponse = {
        message: 'Invalid cloud name',
        name: 'Error',
      };
      mockCloudinaryService.uploadImage.mockResolvedValue(
        mockErrorResponse as any,
      );

      const result = await controller.handleUploadRoomImage(mockPayload);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockPayload.file,
      );
      expect(result).toBeUndefined();
    });

    // --- Scenario 4: Cloudinary Service throws an exception ---
    it('should log an error and return undefined if cloudinaryService.uploadImage throws', async () => {
      const error = new Error('Connection failed');
      mockCloudinaryService.uploadImage.mockRejectedValue(error);

      const result = await controller.handleUploadRoomImage(mockPayload);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockPayload.file,
      );
      expect(result).toBeUndefined();
    });
  });
});
