import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260421141610 extends Migration {
	public async up(): Promise<void> {
		const fileRecords = await this.getCollection('filerecords').updateMany(
			{
				storageType: { $exists: false },
			},
			{
				$set: {
					storageType: 'standard',
				},
			}
		);

		const fileRecordsModifiedCount = Number(fileRecords.modifiedCount) || 0;
		const fileRecordsMatchedCount = Number(fileRecords.matchedCount) || 0;

		console.info(
			`Updated storageType to "standard" for ${fileRecordsModifiedCount} of ${fileRecordsMatchedCount} file records`
		);
	}

	public down(): Promise<void> {
		console.info(
			'Irreversible migration: down() is a no-op because it cannot safely distinguish records updated by up() from records that already had storageType "standard".'
		);
		return Promise.resolve();
	}
}
