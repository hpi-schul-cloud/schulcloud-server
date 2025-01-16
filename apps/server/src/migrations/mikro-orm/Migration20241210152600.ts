import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241210152600 extends Migration {
	public async up(): Promise<void> {
		const roomEditorRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomeditor' },
			{
				$set: {
					permissions: ['ROOM_VIEW', 'ROOM_EDIT'],
				},
			}
		);

		if (roomEditorRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_DELETE removed from role roomeditor.');
		}
	}

	public async down(): Promise<void> {
		const roomEditorRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomeditor' },
			{
				$set: {
					permissions: ['ROOM_VIEW', 'ROOM_EDIT', 'ROOM_DELETE'],
				},
			}
		);

		if (roomEditorRoleUpdate.modifiedCount > 0) {
			console.info(
				'Rollback: Permissions ROOM_DELETE added to and ROOM_MEMBERS_ADD and ROOM_MEMBERS_REMOVE removed from role roomeditor.'
			);
		}
	}
}
