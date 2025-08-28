import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabase1756437796104 implements MigrationInterface {
  name = 'InitialDatabase1756437796104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`room_types\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        UNIQUE INDEX \`IDX_20180102ff8f034e54c5812f69\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`amenities\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        UNIQUE INDEX \`IDX_8c5f9c7ff7e2174b53d4be1024\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`room_amenities\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`room_id\` int NOT NULL,
        \`amenity_id\` int NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rooms\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`room_number\` varchar(255) NOT NULL,
        \`bed_number\` int NOT NULL,
        \`air_conditioned\` tinyint NOT NULL DEFAULT 1,
        \`view\` varchar(255) NOT NULL,
        \`room_type_id\` int NOT NULL,
        \`description\` text NULL,
        \`price\` decimal(10,2) NOT NULL,
        \`image\` varchar(255) NULL,
        \`status\` enum ('0', '1', '2') NOT NULL DEFAULT '1',
        UNIQUE INDEX \`IDX_8f7c6fa4c469bab1a06fe3e49f\` (\`room_number\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`reviews\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`user_id\` int NOT NULL,
        \`booking_room_id\` int NOT NULL,
        \`rating\` int NOT NULL,
        \`comment\` text NOT NULL,
        UNIQUE INDEX \`IDX_0f2c9758def5913294dc40006f\` (\`booking_room_id\`),
        UNIQUE INDEX \`REL_0f2c9758def5913294dc40006f\` (\`booking_room_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`booking_rooms\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`booking_id\` int NOT NULL,
        \`room_id\` int NOT NULL,
        \`price_at_booking\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`services\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`price\` decimal(10,2) NOT NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`IDX_019d74f7abcdcb5a0113010cb0\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`booking_services\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`booking_id\` int NOT NULL,
        \`service_id\` int NOT NULL,
        \`quantity\` int NOT NULL,
        \`price_at_booking\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`promotions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`code\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`discount_type\` enum ('0', '1') NOT NULL COMMENT '0: percentage, 1: fixed_amount' DEFAULT '1',
        \`discount_value\` decimal(10,2) NOT NULL,
        \`min_invoice_value\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`max_discount_amount\` decimal(10,2) NULL,
        \`start_date\` datetime NOT NULL,
        \`end_date\` datetime NOT NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`IDX_8ab10e580f70c3d2e2e4b31ebf\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`invoice_details\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`invoice_id\` int NOT NULL,
        \`item_description\` varchar(255) NOT NULL,
        \`item_type\` enum ('0', '1', '2', '3') NOT NULL,
        \`quantity\` int NOT NULL,
        \`unit_price\` decimal(10,2) NOT NULL,
        \`subtotal\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`invoices\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`staff_id\` int NOT NULL,
        \`booking_id\` int NOT NULL,
        \`invoice_code\` varchar(255) NOT NULL,
        \`subtotal\` decimal(10,2) NOT NULL,
        \`promotion_id\` int NULL,
        \`discount_amount\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`tax\` decimal(10,2) NOT NULL,
        \`total_amount\` decimal(10,2) NOT NULL,
        \`payment_method\` enum ('0', '1', '2') NOT NULL,
        \`status\` enum ('1', '2', '3') NOT NULL DEFAULT '1',
        \`notes\` text NULL,
        \`issued_date\` datetime NOT NULL,
        \`paid_date\` datetime NULL,
        UNIQUE INDEX \`IDX_ed9c7aa7846704bbcb648377e8\` (\`booking_id\`),
        UNIQUE INDEX \`IDX_990e8735a3595990a98fb52efa\` (\`invoice_code\`),
        UNIQUE INDEX \`REL_ed9c7aa7846704bbcb648377e8\` (\`booking_id\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`bookings\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`user_id\` int NOT NULL,
        \`start_time\` datetime NOT NULL,
        \`end_time\` datetime NOT NULL,
        \`num_adults\` int NOT NULL DEFAULT '1',
        \`num_children\` int NOT NULL DEFAULT '0',
        \`status\` enum ('0', '1', '2', '3') NOT NULL DEFAULT '1',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`name\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`phone\` varchar(255) NULL,
        \`role_id\` int NOT NULL,
        \`avatar\` varchar(255) NULL,
        \`status\` enum ('0', '1') NOT NULL DEFAULT '1',
        \`verification_token\` varchar(255) NULL,
        \`password_reset_token\` varchar(255) NULL,
        UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`staff_shifts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`staff_id\` int NOT NULL,
        \`shift_date\` date NOT NULL,
        \`shift_type\` enum ('0', '1', '2') NOT NULL COMMENT '0: morning, 1: afternoon, 2: night',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_amenities\` ADD CONSTRAINT \`FK_1bbdd33b01f2e52f4dd50743544\`
      FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_amenities\` ADD CONSTRAINT \`FK_936612d991e2522e82cd86fa106\`
      FOREIGN KEY (\`amenity_id\`) REFERENCES \`amenities\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rooms\` ADD CONSTRAINT \`FK_8a380bdc519b8701daf0ec62da0\`
      FOREIGN KEY (\`room_type_id\`) REFERENCES \`room_types\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_728447781a30bc3fcfe5c2f1cdf\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_0f2c9758def5913294dc40006fd\`
      FOREIGN KEY (\`booking_room_id\`) REFERENCES \`booking_rooms\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_rooms\` ADD CONSTRAINT \`FK_b71f7c2d8e7f626024a8b2f5a75\`
      FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_rooms\` ADD CONSTRAINT \`FK_cb71638bb7c1eeccc6753551bc6\`
      FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_services\` ADD CONSTRAINT \`FK_813fb23d7e327b6d9cff929cce6\`
      FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_services\` ADD CONSTRAINT \`FK_6e853453a3c24df1beed35c13eb\`
      FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_details\` ADD CONSTRAINT \`FK_2da75e038c5b463f19965b4c739\`
      FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` ADD CONSTRAINT \`FK_14853296d168c36b2fb96c23fa5\`
      FOREIGN KEY (\`staff_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` ADD CONSTRAINT \`FK_ed9c7aa7846704bbcb648377e8f\`
      FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` ADD CONSTRAINT \`FK_e0095f9b92566f27b99400f976c\`
      FOREIGN KEY (\`promotion_id\`) REFERENCES \`promotions\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_64cd97487c5c42806458ab5520c\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\`
      FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`staff_shifts\` ADD CONSTRAINT \`FK_33b27c77ae929c867e4af1a512b\`
      FOREIGN KEY (\`staff_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`staff_shifts\` DROP FOREIGN KEY \`FK_33b27c77ae929c867e4af1a512b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_64cd97487c5c42806458ab5520c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` DROP FOREIGN KEY \`FK_e0095f9b92566f27b99400f976c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` DROP FOREIGN KEY \`FK_ed9c7aa7846704bbcb648377e8f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoices\` DROP FOREIGN KEY \`FK_14853296d168c36b2fb96c23fa5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_details\` DROP FOREIGN KEY \`FK_2da75e038c5b463f19965b4c739\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_services\` DROP FOREIGN KEY \`FK_6e853453a3c24df1beed35c13eb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_services\` DROP FOREIGN KEY \`FK_813fb23d7e327b6d9cff929cce6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_rooms\` DROP FOREIGN KEY \`FK_cb71638bb7c1eeccc6753551bc6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`booking_rooms\` DROP FOREIGN KEY \`FK_b71f7c2d8e7f626024a8b2f5a75\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_0f2c9758def5913294dc40006fd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_728447781a30bc3fcfe5c2f1cdf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rooms\` DROP FOREIGN KEY \`FK_8a380bdc519b8701daf0ec62da0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_amenities\` DROP FOREIGN KEY \`FK_936612d991e2522e82cd86fa106\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_amenities\` DROP FOREIGN KEY \`FK_1bbdd33b01f2e52f4dd50743544\``,
    );
    await queryRunner.query(`DROP TABLE \`staff_shifts\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`bookings\``);
    await queryRunner.query(
      `DROP INDEX \`REL_ed9c7aa7846704bbcb648377e8\` ON \`invoices\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_990e8735a3595990a98fb52efa\` ON \`invoices\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_ed9c7aa7846704bbcb648377e8\` ON \`invoices\``,
    );
    await queryRunner.query(`DROP TABLE \`invoices\``);
    await queryRunner.query(`DROP TABLE \`invoice_details\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8ab10e580f70c3d2e2e4b31ebf\` ON \`promotions\``,
    );
    await queryRunner.query(`DROP TABLE \`promotions\``);
    await queryRunner.query(`DROP TABLE \`booking_services\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_019d74f7abcdcb5a0113010cb0\` ON \`services\``,
    );
    await queryRunner.query(`DROP TABLE \`services\``);
    await queryRunner.query(`DROP TABLE \`booking_rooms\``);
    await queryRunner.query(
      `DROP INDEX \`REL_0f2c9758def5913294dc40006f\` ON \`reviews\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_0f2c9758def5913294dc40006f\` ON \`reviews\``,
    );
    await queryRunner.query(`DROP TABLE \`reviews\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8f7c6fa4c469bab1a06fe3e49f\` ON \`rooms\``,
    );
    await queryRunner.query(`DROP TABLE \`rooms\``);
    await queryRunner.query(`DROP TABLE \`room_amenities\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8c5f9c7ff7e2174b53d4be1024\` ON \`amenities\``,
    );
    await queryRunner.query(`DROP TABLE \`amenities\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_20180102ff8f034e54c5812f69\` ON \`room_types\``,
    );
    await queryRunner.query(`DROP TABLE \`room_types\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``,
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
  }
}
