import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250424080634 extends Migration {
	public async up(): Promise<void> {
		// Add ROOMAPPLICANT role
		await this.getCollection('roles').insertOne({
			name: 'roomapplicant',
			permissions: [],
		});
		console.info('Added ROOMAPPLICANT role without any permissions');
	}

	public async down(): Promise<void> {
		// Remove ROOMAPPLICANT role
		await this.getCollection('roles').deleteOne({ name: 'roomapplicant' });
		console.info('Rollback: Removed ROOMAPPLICANT role');
	}
}
