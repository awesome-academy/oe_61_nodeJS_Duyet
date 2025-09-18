import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import {
  DatabaseModule,
  Invoice,
  Booking,
  User,
  InvoiceDetail,
  Promotion,
  BookingRoom,
  Room,
  Service,
} from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    TypeOrmModule.forFeature([
      Invoice,
      Booking,
      User,
      InvoiceDetail,
      Promotion,
      BookingRoom,
      Room,
      Service,
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
