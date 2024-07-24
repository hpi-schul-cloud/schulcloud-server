import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240724090901 extends Migration {
	async up(): Promise<void> {
		const superheroRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_LOGIN_MIGRATION_FORCE'],
					},
				},
			}
		);

		if (superheroRoleUpdate.modifiedCount > 0) {
			console.info('Permission USER_LOGIN_MIGRATION_FORCE was added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const superheroRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['USER_LOGIN_MIGRATION_FORCE'],
					},
				},
			}
		);

		if (superheroRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Removed permission USER_LOGIN_MIGRATION_FORCE from role superhero.');
		}
	}
}
