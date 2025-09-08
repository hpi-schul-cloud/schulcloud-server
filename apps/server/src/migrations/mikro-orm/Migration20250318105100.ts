import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250318105100 extends Migration {
	private async addPermission(roleName: string, permission: string): Promise<void> {
		const roleUpdate = await this.getCollection('roles').updateOne(
			{ name: roleName },
			{
				$addToSet: {
					permissions: {
						$each: [permission],
					},
				},
			}
		);

		if (roleUpdate.modifiedCount > 0) {
			console.info(`Permission ${permission} added to role ${roleName}.`);
		}
	}

	private async removePermission(roleName: string, permission: string): Promise<void> {
		const roleUpdate = await this.getCollection('roles').updateOne(
			{ name: roleName },
			{
				$pull: {
					permissions: {
						$in: [permission],
					},
				},
			}
		);

		if (roleUpdate.modifiedCount > 0) {
			console.info(`Permission ${permission} removed from role ${roleName}.`);
		}
	}

	public async up(): Promise<void> {
		await this.addPermission('roomviewer', 'ROOM_LEAVE');
		await this.removePermission('roomeditor', 'ROOM_EDIT');
		await this.addPermission('roomeditor', 'ROOM_CONTENT_EDIT');
		await this.addPermission('roomeditor', 'ROOM_LEAVE');
		await this.addPermission('roomadmin', 'ROOM_CONTENT_EDIT');
		await this.addPermission('roomowner', 'ROOM_CONTENT_EDIT');
	}

	public async down(): Promise<void> {
		await this.removePermission('roomviewer', 'ROOM_LEAVE');
		await this.addPermission('roomeditor', 'ROOM_EDIT');
		await this.removePermission('roomeditor', 'ROOM_CONTENT_EDIT');
		await this.removePermission('roomeditor', 'ROOM_LEAVE');
		await this.removePermission('roomadmin', 'ROOM_CONTENT_EDIT');
		await this.removePermission('roomowner', 'ROOM_CONTENT_EDIT');
	}
}
