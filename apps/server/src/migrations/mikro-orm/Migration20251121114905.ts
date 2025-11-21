import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20251121114905 extends Migration {
	public async up(): Promise<void> {
		// Update file records where securityCheck.reason is null and securityCheck.status is "verified"
		// Set securityCheck.reason to "Clean"
		const result = await this.getCollection('files').updateMany(
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

		console.info(
			`Updated securityCheck.reason from null to "Clean" for ${result.modifiedCount} of ${result.matchedCount} verified files`
		);
	}

	public async down(): Promise<void> {
		// no possibility to revert
	}
}
