import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240430140106 extends Migration {
	async up(): Promise<void> {
		const superheroRoleUpdate = await this.driver.nativeUpdate(
			'roles',
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_LOGIN_MIGRATION_ROLLBACK'],
					},
				},
			}
		);

		if (superheroRoleUpdate.affectedRows > 0) {
			console.info('Permission USER_LOGIN_MIGRATION_ROLLBACK was added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const superheroRoleUpdate = await this.driver.nativeUpdate(
			'roles',
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['USER_LOGIN_MIGRATION_ROLLBACK'],
					},
				},
			}
		);

		if (superheroRoleUpdate.affectedRows > 0) {
			console.info('Rollback: Removed permission USER_LOGIN_MIGRATION_ROLLBACK from role superhero.');
		}
	}
}
