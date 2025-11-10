import { Migration } from '@mikro-orm/migrations-mongodb';

const config = {
	administrator: {
		old: [],
		new: ['SCHOOL_LIST_ROOM_MEMBERS'],
	},
	student: {
		old: [],
		new: ['SCHOOL_LIST_ROOM_MEMBERS'],
	},
	teacher: {
		old: [],
		new: ['SCHOOL_LIST_ROOM_MEMBERS'],
	},
	expert: {
		old: [],
		new: ['SCHOOL_LIST_ROOM_MEMBERS'],
	},
};

export class Migration20251110093306 extends Migration {
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
