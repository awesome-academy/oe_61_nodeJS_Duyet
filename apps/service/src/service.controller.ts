import { Controller } from '@nestjs/common';
import { ServiceService } from './service.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateServiceDto,
  ListServiceDto,
  UpdateServiceDto,
} from '@app/common';

@Controller()
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @MessagePattern({ cmd: 'list_services' })
  listUsers(@Payload() listServiceDto: ListServiceDto) {
    return this.serviceService.listServices(listServiceDto);
  }

  @MessagePattern({ cmd: 'create_service' })
  createService(
    @Payload() payload: { createServiceDto: CreateServiceDto; lang: string },
  ) {
    return this.serviceService.createService(payload);
  }

  @MessagePattern({ cmd: 'update_service' })
  updateService(
    @Payload()
    payload: {
      id: number;
      updateServiceDto: UpdateServiceDto;
      lang: string;
    },
  ) {
    return this.serviceService.updateService(payload);
  }

  @MessagePattern({ cmd: 'delete_service' })
  deleteService(@Payload() payload: { id: number; lang: string }) {
    return this.serviceService.deleteService(payload);
  }
}
