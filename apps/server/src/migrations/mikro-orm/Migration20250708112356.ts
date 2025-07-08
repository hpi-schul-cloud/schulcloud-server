import { Migration } from '@mikro-orm/migrations-mongodb';

const config = {
	roomviewer: {
		old: ['ROOM_VIEW', 'ROOM_LEAVE'],
		new: ['ROOM_LEAVE_ROOM', 'ROOM_LIST_CONTENT'],
	},
	roomeditor: {
		old: ['ROOM_VIEW', 'ROOM_CONTENT_EDIT', 'ROOM_LEAVE'],
		new: [
			'ROOM_EDIT_CONTENT',
			'ROOM_LEAVE_ROOM',
			'ROOM_LIST_CONTENT',
			'ROOM_LIST_DRAFTS',
			'ROOM_MANAGE_VIDEOCONFERENCES',
		],
	},
	roomadmin: {
		old: [
			'ROOM_VIEW',
			'ROOM_EDIT',
			'ROOM_MEMBERS_ADD',
			'ROOM_MEMBERS_REMOVE',
			'ROOM_MEMBERS_CHANGE_ROLE',
			'ROOM_CONTENT_EDIT',
			'ROOM_COPY',
			'ROOM_SHARE',
			'ROOM_LEAVE',
		],
		new: [
			'ROOM_EDIT_ROOM',
			'ROOM_SHARE_ROOM',
			'ROOM_COPY_ROOM',
			'ROOM_EDIT_CONTENT',
			'ROOM_REMOVE_MEMBERS',
			'ROOM_ADD_MEMBERS',
			'ROOM_MANAGE_INVITATIONLINKS',
			'ROOM_CHANGE_ROLES',
			'ROOM_LEAVE_ROOM',
			'ROOM_LIST_CONTENT',
			'ROOM_LIST_DRAFTS',
			'ROOM_MANAGE_VIDEOCONFERENCES',
		],
	},
	roomowner: {
		old: [
			'ROOM_VIEW',
			'ROOM_EDIT',
			'ROOM_MEMBERS_ADD',
			'ROOM_MEMBERS_REMOVE',
			'ROOM_MEMBERS_CHANGE_ROLE',
			'ROOM_CONTENT_EDIT',
			'ROOM_COPY',
			'ROOM_SHARE',
			'ROOM_DELETE',
			'ROOM_CHANGE_OWNER',
		],
		new: [
			'ROOM_EDIT_ROOM',
			'ROOM_DELETE_ROOM',
			'ROOM_SHARE_ROOM',
			'ROOM_COPY_ROOM',
			'ROOM_EDIT_CONTENT',
			'ROOM_REMOVE_MEMBERS',
			'ROOM_ADD_MEMBERS',
			'ROOM_MANAGE_INVITATIONLINKS',
			'ROOM_CHANGE_OWNER',
			'ROOM_CHANGE_ROLES',
			'ROOM_LIST_CONTENT',
			'ROOM_LIST_DRAFTS',
			'ROOM_MANAGE_VIDEOCONFERENCES',
		],
	},
	teacher: {
		old: [],
		new: [
			'SCHOOL_CREATE_ROOM',
			'SCHOOL_EDIT_ROOM',
			'SCHOOL_DELETE_ROOM',
			'SCHOOL_LIST_DISCOVERABLE_TEACHERS',
			'SCHOOL_MANAGE_ROOM_INVITATIONLINKS',
			'SCHOOL_BECOME_ROOMOWNER',
		],
	},
	administrator: {
		old: [],
		new: ['SCHOOL_LIST_DISCOVERABLE_TEACHERS'],
	},
};

export class Migration20250708112356 extends Migration {
	private async addPermissions(roleName: string, permissions: string | string[]): Promise<void> {
		if (typeof permissions === 'string') {
			permissions = [permissions];
		}
		const roleUpdate = await this.getCollection('roles').updateOne(
			{ name: roleName },
			{
				$addToSet: {
					permissions: {
						$each: permissions,
					},
				},
			}
		);

		if (roleUpdate.modifiedCount > 0) {
			console.info(`  Permission added to '${roleName}':\n    ${permissions.join(', ')}.\n`);
		}
	}

	private async removePermissions(roleName: string, permissions: string | string[]): Promise<void> {
		if (typeof permissions === 'string') {
			permissions = [permissions];
		}
		const roleUpdate = await this.getCollection('roles').updateOne(
			{ name: roleName },
			{
				$pull: {
					permissions: {
						$in: permissions,
					},
				},
			}
		);

		if (roleUpdate.modifiedCount > 0) {
			console.info(`  Permissions removed from '${roleName}':\n    ${permissions.join(', ')}.\n`);
		}
	}

	public async up(): Promise<void> {
		for (const [roleName, permissions] of Object.entries(config)) {
			await this.removePermissions(roleName, permissions.old);
			await this.addPermissions(roleName, permissions.new);
		}
	}

	public async down(): Promise<void> {
		for (const [roleName, permissions] of Object.entries(config)) {
			await this.removePermissions(roleName, permissions.new);
			await this.addPermissions(roleName, permissions.old);
		}
	}
}
