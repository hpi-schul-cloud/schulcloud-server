import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration202410041210124 extends Migration {
	public async up(): Promise<void> {
		// Add ROOM_VIEWER role
		await this.getCollection('roles').insertOne({
			name: 'room_viewer',
			permissions: ['ROOM_VIEW'],
		});
		console.info('Added ROOM_VIEWER role with ROOM_VIEW permission');

		// Add ROOM_EDITOR role
		await this.getCollection('roles').insertOne({
			name: 'room_editor',
			permissions: ['ROOM_VIEW', 'ROOM_EDIT'],
		});
		console.info('Added ROOM_EDITOR role with ROOM_VIEW and ROOM_EDIT permissions');
	}

	public async down(): Promise<void> {
		// Remove ROOM_VIEWER role
		await this.getCollection('roles').deleteOne({ name: 'room_viewer' });
		console.info('Rollback: Removed ROOM_VIEWER role');

		// Remove ROOM_EDITOR role
		await this.getCollection('roles').deleteOne({ name: 'room_editor' });
		console.info('Rollback: Removed ROOM_EDITOR role');
	}
}
