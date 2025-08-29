import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Booking } from './booking.entity';
import { Room } from './room.entity';
import { Review } from './review.entity';
import { BaseEntity } from './base.entity';
import {
  DECIMAL_PRECISION,
  DECIMAL_SCALE,
} from '@app/common/constants/database.constants';

@Entity({ name: 'booking_rooms' })
export class BookingRoom extends BaseEntity {
  @Column({ type: 'int' })
  booking_id: number;

  @Column({ type: 'int' })
  room_id: number;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  price_at_booking: number;

  @ManyToOne(() => Booking, (booking) => booking.bookingRooms)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Room, (room) => room.bookingRooms)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @OneToOne(() => Review, (review) => review.bookingRoom)
  review: Review;
}
