import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { BookingRoom } from './booking-room.entity';
import { BookingService } from './booking-service.entity';
import { Invoice } from './invoice.entity';
import { BaseEntity } from './base.entity';
import { BookingStatus } from '@app/common/constants/database.constants';

@Entity({ name: 'bookings' })
export class Booking extends BaseEntity {
  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'datetime' })
  start_time: Date;

  @Column({ type: 'datetime' })
  end_time: Date;

  @Column({ type: 'int', default: 1 })
  num_adults: number;

  @Column({ type: 'int', default: 0 })
  num_children: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.BOOKED,
  })
  status: BookingStatus;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => BookingRoom, (bookingRoom) => bookingRoom.booking)
  bookingRooms: BookingRoom[];

  @OneToMany(() => BookingService, (bookingService) => bookingService.booking)
  bookingServices: BookingService[];

  @OneToOne(() => Invoice, (invoice) => invoice.booking)
  invoice: Invoice;
}
