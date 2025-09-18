import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateServiceDto,
  JwtAuthGuard,
  ListServiceDto,
  Roles,
  RolesGuard,
  UpdateServiceDto,
} from '@app/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ParseId } from '@app/common/decorators/parse-id.decorator';

@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminServiceController {
  private readonly logger = new Logger(AdminServiceController.name);
  constructor(
    @Inject('SERVICE_SERVICE') private readonly serviceClient: ClientProxy,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  listServices(@Query() listServiceDto: ListServiceDto) {
    return this.serviceClient.send({ cmd: 'list_services' }, listServiceDto);
  }

  @Post()
  @Roles('admin')
  createService(@Body() createServiceDto: CreateServiceDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.serviceClient.send(
      { cmd: 'create_service' },
      { createServiceDto, lang },
    );
  }

  @Patch(':id')
  @Roles('admin')
  updateService(
    @ParseId('id') id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.serviceClient.send(
      { cmd: 'update_service' },
      { id, updateServiceDto, lang },
    );
  }

  @Delete(':id')
  @Roles('admin')
  deleteService(@ParseId('id') id: number) {
    const lang = I18nContext.current()?.lang || 'vi';
    return this.serviceClient.send({ cmd: 'delete_service' }, { id, lang });
  }
}
