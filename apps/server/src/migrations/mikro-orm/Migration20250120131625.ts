/* eslint-disable no-console */
/* eslint-disable filename-rules/match */
import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250120131625 extends Migration {
	public async up(): Promise<void> {
		const roomOwnerRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomowner' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_MEMBERS_CHANGE_ROLE'],
					},
				},
			}
		);

		if (roomOwnerRoleUpdate.modifiedCount > 0) {
			console.info('Permissions ROOM_MEMBERS_CHANGE_ROLE added to role roomowner.');
		}

		const roomAdminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomadmin' },
			{
				$addToSet: {
					permissions: {
						$each: ['ROOM_MEMBERS_CHANGE_ROLE'],
					},
				},
			}
		);

		if (roomAdminRoleUpdate.modifiedCount > 0) {
			console.info('Permissions ROOM_MEMBERS_CHANGE_ROLE added to role roomadmin.');
		}
	}

	public async down(): Promise<void> {
		const roomOwnerRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomowner' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_MEMBERS_CHANGE_ROLE'],
					},
				},
			}
		);

		if (roomOwnerRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_CREATE removed from role roomowner.');
		}

		const roomAdminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'roomadmin' },
			{
				$pull: {
					permissions: {
						$in: ['ROOM_MEMBERS_CHANGE_ROLE'],
					},
				},
			}
		);

		if (roomAdminRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission ROOM_DELETE removed from role roomadmin.');
		}
	}
}
