import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20261110134024 extends Migration {
	public async up(): Promise<void> {
		const results = await this.getCollection('links').deleteMany({ target: /\/courses\// });

		console.log(`Removed ${results.deletedCount} links`);
	}

	public down(): Promise<void> {
		console.info('Links to courses can not be restored. If necessary, restore from backup.');

		return Promise.resolve();
	}
}
