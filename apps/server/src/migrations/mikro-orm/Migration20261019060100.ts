import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20261019060100 extends Migration {
	public async up(): Promise<void> {
		// startDate and endDate were removed from rooms, so the stored values are dropped as well
		const result = await this.getCollection('rooms').updateMany(
			{ $or: [{ startDate: { $exists: true } }, { endDate: { $exists: true } }] },
			{ $unset: { startDate: '', endDate: '' } }
		);

		console.info(`Removed startDate and endDate from ${result.modifiedCount} rooms.`);
	}

	public down(): Promise<void> {
		console.info(
			'The removed startDate and endDate values of rooms cannot be restored. If necessary, restore from backup.'
		);

		return Promise.resolve();
	}
}
