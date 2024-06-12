import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240605065231 extends Migration {
	async up(): Promise<void> {
		const filerecords = await this.driver.nativeUpdate(
			'filerecords',
			{},
			{ $rename: { schoolId: 'storageLocationId' }, $set: { storageLocation: 'school' } }
		);

		console.info(`${filerecords.affectedRows} Filerecords were migrated to "storageLocationId" and "storageLocation"`);
	}

	async down(): Promise<void> {
		const filerecords = await this.driver.nativeUpdate(
			'filerecords',
			{},
			{ $rename: { storageLocationId: 'schoolId' }, $unset: { storageLocation: '' } }
		);

		console.info(`${filerecords.affectedRows} Filerecords were rolled back to use "schoolId"`);
	}
}
