import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240719115036 extends Migration {
	async up(): Promise<void> {
		await this.driver.nativeUpdate(
			'groups',
			{
				$and: [
					{
						externalSource_externalId: { $exists: true },
					},
					{
						externalSource_system: { $exists: true },
					},
				],
			},
			{
				$unset: { externalSource_externalId: '', externalSource_system: '' },
				$set: {
					externalSource: {
						externalId: '$externalSource_externalId',
						system: '$externalSource_system',
					},
				},
			}
		);

		await this.driver.aggregate('groups', [
			{ $match: { externalSource: { $exists: true } } },
			{
				$set: {
					externalSource: {
						lastSyncedAt: new Date(),
					},
				},
			},
			{ $merge: 'groups' },
		]);

		console.info(`'Added lastSyncedAt to externalSource for all groups`);
	}

	async down(): Promise<void> {
		await this.driver.nativeUpdate(
			'groups',
			{ externalSource: { $exists: true } },
			{
				$unset: ['externalSource.lastSyncedAt'],
			}
		);

		console.info(`Removed lastSyncedAt of externalSource in all groups.'`);
	}
}
