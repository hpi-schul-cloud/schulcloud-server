import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240326072506 extends Migration {
	async up(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Permission USER_CHANGE_OWN_NAME was added to role administrator.');
		}

		const teacherRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'teacher' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		);

		if (teacherRoleUpdate.modifiedCount > 0) {
			console.info('Permission USER_CHANGE_OWN_NAME was added to role teacher.');
		}

		const superheroRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['USER_CHANGE_OWN_NAME', 'ACCOUNT_VIEW', 'ACCOUNT_DELETE'],
					},
				},
			}
		);

		if (superheroRoleUpdate.modifiedCount > 0) {
			console.info('Permissions USER_CHANGE_OWN_NAME, ACCOUNT_VIEW and ACCOUNT_DELETE were added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Removed permission USER_CHANGE_OWN_NAME from role administrator.');
		}

		const teacherRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'teacher' },
			{
				$pull: {
					permissions: {
						$in: ['USER_CHANGE_OWN_NAME'],
					},
				},
			}
		);

		if (teacherRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Removed permission USER_CHANGE_OWN_NAME from role teacher.');
		}

		const superheroRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['USER_CHANGE_OWN_NAME', 'ACCOUNT_VIEW', 'ACCOUNT_DELETE'],
					},
				},
			}
		);

		if (superheroRoleUpdate.modifiedCount > 0) {
			console.info(
				'Rollback: Removed permissions USER_CHANGE_OWN_NAME, ACCOUNT_VIEW and ACCOUNT_DELETE from role superhero.'
			);
		}
	}
}
