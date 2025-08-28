import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { BookingRoom } from './booking-room.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'reviews' })
export class Review extends BaseEntity {
  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int', unique: true })
  booking_room_id: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => BookingRoom, (bookingRoom) => bookingRoom.review)
  @JoinColumn({ name: 'booking_room_id' })
  bookingRoom: BookingRoom;
}
