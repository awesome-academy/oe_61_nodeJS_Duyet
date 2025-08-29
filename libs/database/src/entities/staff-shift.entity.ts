import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';
import { ShiftType } from '@app/common/constants/database.constants';

@Entity({ name: 'staff_shifts' })
export class StaffShift extends BaseEntity {
  @Column({ type: 'int' })
  staff_id: number;

  @Column({ type: 'date' })
  shift_date: Date;

  @Column({
    type: 'enum',
    enum: ShiftType,
    comment: '0: morning, 1: afternoon, 2: night',
  })
  shift_type: ShiftType;

  @ManyToOne(() => User, (user) => user.staffShifts)
  @JoinColumn({ name: 'staff_id' })
  staff: User;
}
