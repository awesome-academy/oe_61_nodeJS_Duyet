/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AdminServiceController } from './admin-service.controller';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, of, throwError } from 'rxjs';
import { I18nService, I18nContext } from 'nestjs-i18n';
import {
  CreateServiceDto,
  JwtAuthGuard,
  ListServiceDto,
  RolesGuard,
  UpdateServiceDto,
} from '@app/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// --- Mock dependency ---
const mockServiceClient = { send: jest.fn() };
const mockI18nService: Partial<I18nService> = {
  t: jest.fn().mockImplementation((key: string) => key),
};

// --- Mock I18nContext.current ---
(I18nContext as unknown as { current: jest.Mock }).current = jest
  .fn()
  .mockReturnValue({ lang: 'vi' });

describe('AdminServiceController', () => {
  let controller: AdminServiceController;
  let serviceClient: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminServiceController],
      providers: [
        { provide: 'SERVICE_SERVICE', useValue: mockServiceClient },
        { provide: I18nService, useValue: mockI18nService },
      ],
    })
      // override guards để luôn return true
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminServiceController>(AdminServiceController);
    serviceClient = module.get<ClientProxy>('SERVICE_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- listServices ---
  describe('listServices', () => {
    it('should call serviceClient.send with correct payload', () => {
      const dto = {} as ListServiceDto;
      mockServiceClient.send.mockReturnValue(of({}));
      controller.listServices(dto);
      expect(serviceClient.send).toHaveBeenCalledWith(
        { cmd: 'list_services' },
        dto,
      );
    });
  });

  // --- createService ---
  describe('createService', () => {
    const createDto = {} as CreateServiceDto;

    it('should call serviceClient.send with correct payload', () => {
      mockServiceClient.send.mockReturnValue(of({}));
      controller.createService(createDto);
      expect(serviceClient.send).toHaveBeenCalledWith(
        { cmd: 'create_service' },
        { createServiceDto: createDto, lang: 'vi' },
      );
    });

    it('should propagate RpcException on failure', async () => {
      const rpcError = new RpcException('Service exists');
      mockServiceClient.send.mockReturnValue(throwError(() => rpcError));
      await expect(
        firstValueFrom(controller.createService(createDto)),
      ).rejects.toThrow(rpcError);
    });

    describe('CreateServiceDto validation', () => {
      it('should pass validation with all valid fields', async () => {
        const dto = plainToInstance(CreateServiceDto, {
          name: 'Test Service',
          description: 'A description',
          price: 100,
          is_active: true,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation if name is missing', async () => {
        const dto = plainToInstance(CreateServiceDto, {
          description: 'A description',
          price: 100,
          is_active: true,
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'name')).toBe(true);
      });

      it('should fail validation if price is missing', async () => {
        const dto = plainToInstance(CreateServiceDto, {
          name: 'Test Service',
          description: 'A description',
          is_active: true,
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'price')).toBe(true);
      });

      it('should fail validation if price is negative', async () => {
        const dto = plainToInstance(CreateServiceDto, {
          name: 'Test Service',
          description: 'A description',
          price: -10,
          is_active: true,
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'price')).toBe(true);
      });

      it('should fail validation if name is not string', async () => {
        const dto = plainToInstance(CreateServiceDto, {
          name: 123,
          price: 100,
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'name')).toBe(true);
      });
    });
  });

  // --- updateService ---
  describe('updateService', () => {
    const updateDto = {} as UpdateServiceDto;
    const serviceId = 1;

    it('should call serviceClient.send with correct payload', () => {
      mockServiceClient.send.mockReturnValue(of({}));
      controller.updateService(serviceId, updateDto);
      expect(serviceClient.send).toHaveBeenCalledWith(
        { cmd: 'update_service' },
        { id: serviceId, updateServiceDto: updateDto, lang: 'vi' },
      );
    });

    it('should propagate RpcException on failure', async () => {
      const rpcError = new RpcException('Service not found');
      mockServiceClient.send.mockReturnValue(throwError(() => rpcError));
      await expect(
        firstValueFrom(controller.updateService(serviceId, updateDto)),
      ).rejects.toThrow(rpcError);
    });

    describe('UpdateServiceDto validation', () => {
      it('should pass validation with all valid fields', async () => {
        const dto = plainToInstance(UpdateServiceDto, {
          name: 'Updated Service',
          description: 'Updated description',
          price: 200,
          is_active: false,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should pass validation if no fields provided (all optional)', async () => {
        const dto = plainToInstance(UpdateServiceDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation if name is not string', async () => {
        const dto = plainToInstance(UpdateServiceDto, {
          name: 123 as unknown as string,
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'name')).toBe(true);
      });

      it('should fail validation if price is negative', async () => {
        const dto = plainToInstance(UpdateServiceDto, {
          price: -50,
        });

        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'price')).toBe(true);
      });
    });
  });

  // --- deleteService ---
  describe('deleteService', () => {
    const serviceId = 1;

    it('should call serviceClient.send with correct payload', () => {
      mockServiceClient.send.mockReturnValue(of({}));
      controller.deleteService(serviceId);
      expect(serviceClient.send).toHaveBeenCalledWith(
        { cmd: 'delete_service' },
        { id: serviceId, lang: 'vi' },
      );
    });

    it('should propagate RpcException on failure', async () => {
      const rpcError = new RpcException('Service not found');
      mockServiceClient.send.mockReturnValue(throwError(() => rpcError));
      await expect(
        firstValueFrom(controller.deleteService(serviceId)),
      ).rejects.toThrow(rpcError);
    });
  });
});
