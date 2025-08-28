import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RoomType } from './room-type.entity';
import { BookingRoom } from './booking-room.entity';
import { RoomAmenity } from './room-amenity.entity';
import {
  DECIMAL_PRECISION,
  DECIMAL_SCALE,
} from '@app/common/constants/database.constants';
import { BaseEntity } from './base.entity';
import { RoomStatus } from '@app/common/constants/database.constants';

@Entity({ name: 'rooms' })
export class Room extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  room_number: string;

  @Column({ type: 'int' })
  bed_number: number;

  @Column({ type: 'boolean', default: true })
  air_conditioned: boolean;

  @Column({ type: 'varchar' })
  view: string;

  @Column({ type: 'int' })
  room_type_id: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  price: number;

  @Column({ type: 'varchar', nullable: true })
  image: string;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @ManyToOne(() => RoomType, (roomType) => roomType.rooms)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;

  @OneToMany(() => BookingRoom, (bookingRoom) => bookingRoom.room)
  bookingRooms: BookingRoom[];

  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.room)
  roomAmenities: RoomAmenity[];
}
