import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';
import { BaseEntity } from './base.entity';
import {
  DECIMAL_PRECISION,
  DECIMAL_SCALE,
} from '@app/common/constants/database.constants';
import { ItemType } from '@app/common/constants/database.constants';

@Entity({ name: 'invoice_details' })
export class InvoiceDetail extends BaseEntity {
  @Column({ type: 'int' })
  invoice_id: number;

  @Column({ type: 'varchar' })
  item_description: string;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  item_type: ItemType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  unit_price: number;

  @Column({
    type: 'decimal',
    precision: DECIMAL_PRECISION,
    scale: DECIMAL_SCALE,
  })
  subtotal: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.invoiceDetails)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
