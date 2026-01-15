import { Migration } from '@mikro-orm/migrations-mongodb';

const config = {
	teamadministrator: {
		old: ['INVITE_EXPERTS'],
		new: ['INVITE_EXTERNAL_PERSONS'],
	},
};

export class Migration20251126094351 extends Migration {
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
				// @ts-ignore // MongoDB types are wrong here
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
