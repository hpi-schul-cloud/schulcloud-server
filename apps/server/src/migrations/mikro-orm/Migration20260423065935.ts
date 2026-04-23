import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20260423065935 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('h5p-cache').deleteMany({});
		console.info('Cleared all entries from h5p-cache collection');
	}
}
