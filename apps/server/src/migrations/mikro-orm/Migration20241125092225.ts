import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241125092225 extends Migration {
	public async up(): Promise<void> {
		// Add GUESTSTUDENT role
		await this.getCollection('roles').insertOne({
			name: 'guestStudent',
			permissions: [],
		});
		console.info('Added GUESTSTUDENT role');

		// Add GUESTTEACHER role
		await this.getCollection('roles').insertOne({
			name: 'guestTeacher',
			permissions: [],
		});
		console.info('Added GUESTTEACHER role');
	}

	public async down(): Promise<void> {
		// Remove GUESTSTUDENT role
		await this.getCollection('roles').deleteOne({ name: 'guestStudent' });
		console.info('Rollback: Removed GUESTSTUDENT role');

		// Remove GUESTTEACHER role
		await this.getCollection('roles').deleteOne({ name: 'guestTeacher' });
		console.info('Rollback: Removed GUESTTEACHER role');
	}
}
