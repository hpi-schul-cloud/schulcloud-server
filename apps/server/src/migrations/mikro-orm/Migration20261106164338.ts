import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20261106164338 extends Migration {
	public async up(): Promise<void> {
		// all teams-files should be marked for getting deleted at a specific date
		const result = await this.getCollection('files').updateMany(
			{ refOwnerModel: 'teams' },
			{ $set: { deletedAt: new Date('2026-11-01T10:00:00Z') } }
		);

		console.info(`Marked ${result.modifiedCount} teams-files for deletion.`);
	}

	public down(): Promise<void> {
		console.info('Teams files can not be restored. If necessary, restore from backup.');

		return Promise.resolve();
	}
}
