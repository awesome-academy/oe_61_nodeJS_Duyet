import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import {
  CreateServiceDto,
  ListServiceDto,
  UpdateServiceDto,
} from '@app/common';

describe('ServiceController', () => {
  let controller: ServiceController;
  let serviceService: {
    listServices: jest.Mock;
    createService: jest.Mock;
    updateService: jest.Mock;
    deleteService: jest.Mock;
  };

  beforeEach(async () => {
    serviceService = {
      listServices: jest.fn(),
      createService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [{ provide: ServiceService, useValue: serviceService }],
    }).compile();

    controller = module.get<ServiceController>(ServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listUsers', () => {
    it('should return list of services', async () => {
      const payload: ListServiceDto = { page: 1, limit: 10, search: 'test' };
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, last_page: 0 },
      };
      serviceService.listServices.mockResolvedValue(mockResult);

      const result = await controller.listUsers(payload);
      expect(result).toEqual(mockResult);
      expect(serviceService.listServices).toHaveBeenCalledWith(payload);
    });
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      const payload = {
        createServiceDto: {
          name: 'Test Service',
          description: 'desc',
          price: 100,
          is_active: true,
        } as CreateServiceDto,
        lang: 'en',
      };
      const mockResult = {
        status: true,
        message: 'service.CREATED_SUCCESS',
        data: { id: 1, ...payload.createServiceDto },
      };
      serviceService.createService.mockResolvedValue(mockResult);

      const result = await controller.createService(payload);
      expect(result).toEqual(mockResult);
      expect(serviceService.createService).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateService', () => {
    it('should update a service', async () => {
      const payload = {
        id: 1,
        updateServiceDto: {
          name: 'Updated Service',
          description: 'updated',
          price: 200,
          is_active: true,
        } as UpdateServiceDto,
        lang: 'en',
      };
      const mockResult = {
        status: true,
        message: 'service.UPDATED_SUCCESS',
        data: { id: 1, ...payload.updateServiceDto },
      };
      serviceService.updateService.mockResolvedValue(mockResult);

      const result = await controller.updateService(payload);
      expect(result).toEqual(mockResult);
      expect(serviceService.updateService).toHaveBeenCalledWith(payload);
    });
  });

  describe('deleteService', () => {
    it('should delete a service', async () => {
      const payload = { id: 1, lang: 'en' };
      const mockResult = {
        status: true,
        message: 'service.DELETED_SUCCESS',
        data: {
          id: 1,
          name: 'Test Service',
          description: 'desc',
          price: 100,
          is_active: true,
        },
      };
      serviceService.deleteService.mockResolvedValue(mockResult);

      const result = await controller.deleteService(payload);
      expect(result).toEqual(mockResult);
      expect(serviceService.deleteService).toHaveBeenCalledWith(payload);
    });
  });
});
