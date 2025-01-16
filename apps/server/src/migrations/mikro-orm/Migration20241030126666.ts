import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration202410041210124 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('files').createIndex({ createdAt: 1 });
	}

	public async down(): Promise<void> {
		// no need
	}
}
