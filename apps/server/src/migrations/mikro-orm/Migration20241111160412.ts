import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241111160412 extends Migration {
	public async up(): Promise<void> {
		// Rename ROOM_VIEWER role from room_viewer to roomviewer
		await this.getCollection('roles').updateMany({ name: 'room_viewer' }, { $set: { name: 'roomviewer' } });

		console.info('Renamed ROOM_VIEWER role from room_viewer to roomviewer');

		// Rename ROOM_EDITOR role from room_editor to roomeditor
		await this.getCollection('roles').updateMany({ name: 'room_editor' }, { $set: { name: 'roomeditor' } });

		console.info('Renamed ROOM_EDITOR role from room_editor to roomeditor');
	}

	public async down(): Promise<void> {
		// Rename ROOM_VIEWER role from roomviewer to room_viewer
		await this.getCollection('roles').updateMany({ name: 'roomviewer' }, { $set: { name: 'room_viewer' } });

		console.info('Rollback: Renamed ROOM_VIEWER role from roomviewer to room_viewer');

		// Rename ROOM_EDITOR role from roomeditor to room_editor
		await this.getCollection('roles').updateMany({ name: 'roomeditor' }, { $set: { name: 'room_editor' } });

		console.info('Rollback: Renamed ROOM_EDITOR role from roomeditor to room_editor');
	}
}
