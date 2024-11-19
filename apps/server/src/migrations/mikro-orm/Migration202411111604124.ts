import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241111160412 extends Migration {
	async up(): Promise<void> {
		// Rename ROOMVIEWER role from room_viewer to roomviewer
		await this.getCollection('roles').updateMany({ name: 'room_viewer' }, { $set: { name: 'roomviewer' } });

		console.info('Renamed ROOMVIEWER role from room_viewer to roomviewer');

		// Rename ROOMEDITOR role from room_editor to roomeditor
		await this.getCollection('roles').updateMany({ name: 'room_editor' }, { $set: { name: 'roomeditor' } });

		console.info('Renamed ROOMEDITOR role from room_editor to roomeditor');
	}

	async down(): Promise<void> {
		// Rename ROOMVIEWER role from roomviewer to room_viewer
		await this.getCollection('roles').updateMany({ name: 'roomviewer' }, { $set: { name: 'room_viewer' } });

		console.info('Rollback: Renamed ROOMVIEWER role from roomviewer to room_viewer');

		// Rename ROOMEDITOR role from roomeditor to room_editor
		await this.getCollection('roles').updateMany({ name: 'roomeditor' }, { $set: { name: 'room_editor' } });

		console.info('Rollback: Renamed ROOMEDITOR role from roomeditor to room_editor');
	}
}
