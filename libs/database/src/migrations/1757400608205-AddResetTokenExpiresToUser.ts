import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetTokenExpiresToUser1757400608205
  implements MigrationInterface
{
  name = 'AddResetTokenExpiresToUser1757400608205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`password_reset_expires\` datetime NULL`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`password_reset_expires\``,
    );
  }
}
