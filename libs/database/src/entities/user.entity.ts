import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Role } from './role.entity';
import { Booking } from './booking.entity';
import { Invoice } from './invoice.entity';
import { Review } from './review.entity';
import { StaffShift } from './staff-shift.entity';
import { BaseEntity } from './base.entity';
import { UserStatus } from '@app/common/constants/database.constants';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'int' })
  role_id: number;

  @Column({ type: 'varchar', nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'varchar', nullable: true })
  verification_token: string | null;

  @Column({ type: 'varchar', nullable: true })
  password_reset_token: string | null;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Invoice, (invoice) => invoice.staff)
  invoices: Invoice[];

  @OneToMany(() => StaffShift, (shift) => shift.staff)
  staffShifts: StaffShift[];
}
