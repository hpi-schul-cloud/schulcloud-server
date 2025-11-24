import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20251121114905 extends Migration {
	public async up(): Promise<void> {
		// Update file records where securityCheck.reason is null and securityCheck.status is "verified"
		// Set securityCheck.reason to "Clean"
		const fileRecords = await this.getCollection('filerecords').updateMany(
			{
				'securityCheck.reason': null,
				'securityCheck.status': 'verified',
			},
			{
				$set: {
					'securityCheck.reason': 'Clean',
					'securityCheck.updatedAt': new Date(),
				},
			}
		);

		const fileRecordsModifiedCount = Number(fileRecords.modifiedCount) || 0;
		const fileRecordsMatchedCount = Number(fileRecords.matchedCount) || 0;

		console.info(
			`Updated securityCheck.reason from null to "Clean" for ${fileRecordsModifiedCount} of ${fileRecordsMatchedCount} verified file records`
		);

		const files = await this.getCollection('files').updateMany(
			{
				'securityCheck.reason': null,
				'securityCheck.status': 'verified',
			},
			{
				$set: {
					'securityCheck.reason': 'Clean',
					'securityCheck.updatedAt': new Date(),
				},
			}
		);

		const filesModifiedCount = Number(files.modifiedCount) || 0;
		const filesMatchedCount = Number(files.matchedCount) || 0;

		console.info(
			`Updated securityCheck.reason from null to "Clean" for ${filesModifiedCount} of ${filesMatchedCount} verified files`
		);
	}

	public async down(): Promise<void> {
		console.log('Migration down: no possibility to revert.');
	}
}
