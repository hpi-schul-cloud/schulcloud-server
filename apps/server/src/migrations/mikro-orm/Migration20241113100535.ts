import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241113100535 extends Migration {
	public async up(): Promise<void> {
		const teacherRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_CREATE'],
					},
				},
			}
		);

		if (teacherRoleUpdate.modifiedCount > 0) {
			console.info('Permissions ROOM_CREATE added to role teacher.');
		}

		const roomEditorRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomeditor' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_DELETE'],
					},
				},
			}
		);

		if (roomEditorRoleUpdate.modifiedCount > 0) {
			console.info('Permissions ROOM_DELETE added to role roomeditor.');
		}
	}

	public async down(): Promise<void> {
		const teacherRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_CREATE'],
					},
				},
			}
		);

		if (teacherRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_CREATE removed from role teacher.');
		}

		const roomEditorRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomeditor' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_DELETE'],
					},
				},
			}
		);

		if (roomEditorRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_DELETE removed from role roomeditor.');
		}
	}
}
