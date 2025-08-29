import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { Service } from './service.entity';
import {
  DECIMAL_PRECISION,
  DECIMAL_SCALE,
} from '@app/common/constants/database.constants';
import { BaseEntity } from './base.entity';

@Entity({ name: 'booking_services' })
export class BookingService extends BaseEntity {
  @Column({ type: 'int' })
  booking_id: number;

  @Column({ type: 'int' })
  service_id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  price_at_booking: number;

  @ManyToOne(() => Booking, (booking) => booking.bookingServices)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Service, (service) => service.bookingServices)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
