import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Room } from './room.entity';
import { Amenity } from './amenity.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'room_amenities' })
export class RoomAmenity extends BaseEntity {
  @Column({ type: 'int' })
  room_id: number;

  @Column({ type: 'int' })
  amenity_id: number;

  @ManyToOne(() => Room, (room) => room.roomAmenities)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => Amenity, (amenity) => amenity.roomAmenities)
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;
}
