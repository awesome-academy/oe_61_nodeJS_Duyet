import { Entity, Column, OneToMany } from 'typeorm';
import { BookingService } from './booking-service.entity';
import { BaseEntity } from './base.entity';
import {
  DECIMAL_PRECISION,
  DECIMAL_SCALE,
} from '@app/common/constants/database.constants';

@Entity({ name: 'services' })
export class Service extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  price: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => BookingService, (bookingService) => bookingService.service)
  bookingServices: BookingService[];
}
