import { Entity, Column, OneToMany } from 'typeorm';
import { Invoice } from './invoice.entity';
import { BaseEntity } from './base.entity';
import {
  DECIMAL_PRECISION,
  DECIMAL_SCALE,
} from '@app/common/constants/database.constants';
import { DiscountType } from '@app/common/constants/database.constants';

@Entity({ name: 'promotions' })
export class Promotion extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.FIXED_AMOUNT,
    comment: '0: percentage, 1: fixed_amount',
  })
  discount_type: DiscountType;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  discount_value: number;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
    default: 0,
  })
  min_invoice_value: number;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
    nullable: true,
  })
  max_discount_amount: number;

  @Column({ type: 'datetime' })
  start_date: Date;

  @Column({ type: 'datetime' })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Invoice, (invoice) => invoice.promotion)
  invoices: Invoice[];
}
