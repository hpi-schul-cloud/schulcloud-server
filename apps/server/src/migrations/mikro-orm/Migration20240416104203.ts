import { Migration } from '@mikro-orm/migrations-mongodb';

// add migration wizard permissions to admin role
export class Migration20240416104203 extends Migration {
	async up(): Promise<void> {
		const adminRoleUpdate = await this.driver.nativeUpdate(
			'roles',
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['IMPORT_USER_MIGRATE', 'IMPORT_USER_UPDATE', 'IMPORT_USER_VIEW'],
					},
				},
			}
		);

		if (adminRoleUpdate.affectedRows > 0) {
			console.info(
				'Permissions IMPORT_USER_MIGRATE, IMPORT_USER_UPDATE, IMPORT_USER_VIEW were added to role administrator.'
			);
		}
	}

	async down(): Promise<void> {
		const adminRoleUpdate = await this.driver.nativeUpdate(
			'roles',
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['IMPORT_USER_MIGRATE', 'IMPORT_USER_UPDATE', 'IMPORT_USER_VIEW'],
					},
				},
			}
		);

		if (adminRoleUpdate.affectedRows > 0) {
			console.info(
				'Rollback: Removed permissions IMPORT_USER_MIGRATE, IMPORT_USER_UPDATE, IMPORT_USER_VIEW from role administrator.'
			);
		}
	}
}
