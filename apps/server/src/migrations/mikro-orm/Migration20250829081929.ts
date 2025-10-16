import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250829081929 extends Migration {
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
		await this.addPermission('user', 'GROUP_VIEW');
		await this.addPermission('teacher', 'GROUP_LIST');
		await this.addPermission('administrator', 'GROUP_LIST');
		await this.addPermission('superhero', 'GROUP_LIST');
	}

	public async down(): Promise<void> {
		await this.removePermission('user', 'GROUP_VIEW');
		await this.removePermission('teacher', 'GROUP_LIST');
		await this.removePermission('administrator', 'GROUP_LIST');
		await this.removePermission('superhero', 'GROUP_LIST');
	}
}
