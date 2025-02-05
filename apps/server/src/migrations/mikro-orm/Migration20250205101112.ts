import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250205101112 extends Migration {
	public async up(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomadmin' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_LEAVE'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_LEAVE added to role roomadmin.');
		}

		const editorRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomeditor' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_LEAVE'],
					},
				},
			}
		);

		if (editorRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_LEAVE added to role roomeditor.');
		}

		const viewerRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomviewer' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_LEAVE'],
					},
				},
			}
		);

		if (viewerRoleUpdate.modifiedCount > 0) {
			console.info('Permission ROOM_LEAVE added to role roomviewer.');
		}
	}

	public async down(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomadmin' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_LEAVE'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_LEAVE added to role roomadmin.');
		}

		const editorRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomeditor' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_LEAVE'],
					},
				},
			}
		);

		if (editorRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_LEAVE added to role roomeditor.');
		}

		const viewerRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomviewer' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_LEAVE'],
					},
				},
			}
		);

		if (viewerRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_LEAVE added to role roomviewer.');
		}
	}
}
