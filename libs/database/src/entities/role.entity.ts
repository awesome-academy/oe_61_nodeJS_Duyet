import { Entity, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
