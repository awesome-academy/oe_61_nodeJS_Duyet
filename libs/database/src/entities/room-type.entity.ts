import { Entity, Column, OneToMany } from 'typeorm';
import { Room } from './room.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'room_types' })
export class RoomType extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Room, (room) => room.roomType)
  rooms: Room[];
}
