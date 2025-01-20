import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241209165812 extends Migration {
	public async up(): Promise<void> {
		// Add ROOM_OWNER role
		await this.getCollection('roles').insertOne({
			name: 'roomowner',
			permissions: [
				'ROOM_VIEW',
				'ROOM_EDIT',
				'ROOM_DELETE',
				'ROOM_MEMBERS_ADD',
				'ROOM_MEMBERS_REMOVE',
				'ROOM_CHANGE_OWNER',
			],
		});
		console.info(
			'Added ROOM_OWNER role with ROOM_VIEW, -_EDIT, _DELETE, -_MEMBERS_ADD, -_MEMBERS_REMOVE AND -_CHANGE_OWNER permission'
		);

		// Add ROOM_ADMIN role
		await this.getCollection('roles').insertOne({
			name: 'roomadmin',
			permissions: ['ROOM_VIEW', 'ROOM_EDIT', 'ROOM_MEMBERS_ADD', 'ROOM_MEMBERS_REMOVE'],
		});
		console.info(
			'Added ROOM_ADMIN role with ROOM_VIEW, ROOM_EDIT, ROOM_MEMBERS_ADD AND ROOM_MEMBERS_REMOVE permissions'
		);
	}

	public async down(): Promise<void> {
		// Remove ROOM_OWNER role
		await this.getCollection('roles').deleteOne({ name: 'roomowner' });
		console.info('Rollback: Removed ROOM_OWNER role');

		// Remove ROOM_ADMIN role
		await this.getCollection('roles').deleteOne({ name: 'roomadmin' });
		console.info('Rollback: Removed ROOM_ADMIN role');
	}
}
