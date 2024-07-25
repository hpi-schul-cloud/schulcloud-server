import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240719115036 extends Migration {
	async up(): Promise<void> {
		await this.driver.aggregate('groups', [
			{ $match: { externalSource_externalId: { $exists: true } } },
			{
				$set: {
					externalSource: {
						externalId: '$externalSource_externalId',
						system: '$externalSource_system',
					},
				},
			},
			{ $merge: 'groups' },
		]);

		await this.driver.nativeUpdate(
			'groups',
			{},
			{
				$unset: { externalSource_externalId: '', externalSource_system: '' },
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

		console.info(`' Removed synced courses for all groups and added lastSyncedAt to externalSource`);
	}

	async down(): Promise<void> {
		await this.driver.nativeUpdate('groups', {}, { $unset: { 'externalSource.lastSyncedAt': '' } });

		console.info(`Removed lastSyncedAt of externalSource in all groups.'`);
	}
}
