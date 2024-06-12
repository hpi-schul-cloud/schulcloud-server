import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240612122202 extends Migration {
	async up(): Promise<void> {
		const filerecords = await this.driver.nativeUpdate('filerecords', {}, { $rename: { school: 'storageLocationId' } });

		console.info(`${filerecords.affectedRows} Filerecords were migrated to "storageLocationId"`);
	}

	async down(): Promise<void> {
		const filerecords = await this.driver.nativeUpdate('filerecords', {}, { $rename: { storageLocationId: 'school' } });

		console.info(`${filerecords.affectedRows} Filerecords were rolled back to use "schoolId"`);
	}
}
