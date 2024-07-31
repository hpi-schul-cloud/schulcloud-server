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
		console.info(
			`Migrate fields externalSource_externalId and externalSource_system to nested document externalSource`
		);

		await this.driver.nativeUpdate(
			'groups',
			{},
			{
				$unset: { externalSource_externalId: '', externalSource_system: '' },
			}
		);
		console.info(`Removed fields externalSource_externalId and externalSource_system`);

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

		console.info(`Updated nested document externalSource. Added nested field lastSyncedAt`);
	}

	async down(): Promise<void> {
		await this.driver.aggregate('groups', [
			{ $match: { externalSource: { $exists: true } } },
			{
				$set: {
					externalSource_externalId: '$externalSource.externalId',
					externalSource_system: '$externalSource.system',
				},
			},
			{ $merge: 'groups' },
		]);
		console.info(
			`Rollback: Migrate fields externalSource_externalId and externalSource_system to nested document externalSource`
		);

		await this.driver.nativeUpdate(
			'groups',
			{ externalSource: { $exists: true } },
			{
				$unset: { externalSource: '' },
			}
		);
		console.info(`Removed externalSource nested document`);
	}
}
