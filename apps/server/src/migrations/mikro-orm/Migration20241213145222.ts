import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241213145222 extends Migration {
	public async up(): Promise<void> {
		await this.getCollection('files').createIndex({ 'securityCheck.requestToken': 1 });
	}

	public async down(): Promise<void> {
		// no need
	}
}
