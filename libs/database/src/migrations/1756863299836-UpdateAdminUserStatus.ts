import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAdminUserStatus1756863299836 implements MigrationInterface {
  name = 'UpdateAdminUserStatus1756863299836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update admin user status to ACTIVE
    await queryRunner.query(`
            UPDATE users 
            SET status = 1 
            WHERE email = 'admin@hotel.com' AND role_id = (
                SELECT id FROM roles WHERE name = 'admin'
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert admin user status to INACTIVE
    await queryRunner.query(`
            UPDATE users 
            SET status = 0 
            WHERE email = 'admin@hotel.com' AND role_id = (
                SELECT id FROM roles WHERE name = 'admin'
            )
        `);
  }
}
