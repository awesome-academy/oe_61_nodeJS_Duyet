import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAdminUserStatus1756863299835 implements MigrationInterface {
  name = 'UpdateAdminUserStatus1756863299835';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoice_details\` DROP COLUMN \`item_type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_details\` ADD \`item_type\` enum ('0', '1', '2', '3') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoice_details\` DROP COLUMN \`item_type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_details\` ADD \`item_type\` int NOT NULL`,
    );
  }
}
