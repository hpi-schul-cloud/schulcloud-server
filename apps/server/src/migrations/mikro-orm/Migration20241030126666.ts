import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration202410041210124 extends Migration {
	async up(): Promise<void> {
		await this.getCollection('files').createIndex({ createdAt: 1 });
	}

	async down(): Promise<void> {
		// no need
	}
}
