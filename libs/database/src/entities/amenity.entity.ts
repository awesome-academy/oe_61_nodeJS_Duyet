import { Entity, Column, OneToMany } from 'typeorm';
import { RoomAmenity } from './room-amenity.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'amenities' })
export class Amenity extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.amenity)
  roomAmenities: RoomAmenity[];
}
