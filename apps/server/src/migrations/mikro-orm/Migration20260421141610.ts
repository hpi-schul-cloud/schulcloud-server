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

	public async down(): Promise<void> {
		const fileRecords = await this.getCollection('filerecords').updateMany(
			{
				storageType: 'standard',
			},
			{
				$unset: {
					storageType: '',
				},
			}
		);

		const fileRecordsModifiedCount = Number(fileRecords.modifiedCount) || 0;
		const fileRecordsMatchedCount = Number(fileRecords.matchedCount) || 0;

		console.info(
			`Removed storageType field for ${fileRecordsModifiedCount} of ${fileRecordsMatchedCount} file records`
		);
	}
}
