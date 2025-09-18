import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { BookingService, DatabaseModule, Service } from '@app/database';
import { CommonModule } from '@app/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([Service, BookingService]),
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
