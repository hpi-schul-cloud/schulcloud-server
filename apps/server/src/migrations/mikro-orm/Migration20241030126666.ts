import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241030126666 extends Migration {
	async up(): Promise<void> {
		await this.getCollection('files').createIndex({ createdAt: 1 });
	}

	async down(): Promise<void> {
		// no need
	}
}
