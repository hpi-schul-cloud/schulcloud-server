import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241004121012 extends Migration {
	async up(): Promise<void> {
		// Add ROOMVIEWER role
		await this.getCollection('roles').insertOne({
			name: 'room_viewer',
			permissions: ['ROOM_VIEW'],
		});
		console.info('Added ROOMVIEWER role with ROOM_VIEW permission');

		// Add ROOMEDITOR role
		await this.getCollection('roles').insertOne({
			name: 'room_editor',
			permissions: ['ROOM_VIEW', 'ROOM_EDIT'],
		});
		console.info('Added ROOMEDITOR role with ROOM_VIEW and ROOM_EDIT permissions');
	}

	async down(): Promise<void> {
		// Remove ROOMVIEWER role
		await this.getCollection('roles').deleteOne({ name: 'room_viewer' });
		console.info('Rollback: Removed ROOMVIEWER role');

		// Remove ROOMEDITOR role
		await this.getCollection('roles').deleteOne({ name: 'room_editor' });
		console.info('Rollback: Removed ROOMEDITOR role');
	}
}
