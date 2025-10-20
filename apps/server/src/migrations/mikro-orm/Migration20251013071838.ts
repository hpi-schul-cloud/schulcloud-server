import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250911071838 extends Migration {
	public async up(): Promise<void> {
		// Due to a long living bug in the legacy client a lot of birthdays were not saved with 0 hours on the correct day but with 22 or 23 hours on the day before.
		// These birthdays are displayed wrong in the nuxt-client. The bug is fixed and we fix the existing data with this migration.

		const result = await this.getCollection('users').updateMany(
			{
				birthday: { $ne: null },
				$expr: { $ne: [{ $hour: '$birthday' }, 0] },
			},
			[
				{
					$set: {
						birthday: {
							$dateTrunc: {
								date: {
									$dateAdd: {
										startDate: '$birthday',
										unit: 'day',
										amount: 1,
									},
								},
								unit: 'day',
								binSize: 1,
								timezone: 'UTC',
							},
						},
					},
				},
			]
		);

		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		console.info(`Fixed ${result.modifiedCount} of ${result.matchedCount} wrong birthdays`);
	}

	public async down(): Promise<void> {
		// no possibility to revert
	}
}
