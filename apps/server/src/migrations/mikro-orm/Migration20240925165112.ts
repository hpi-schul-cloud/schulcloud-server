import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240925165112 extends Migration {
	async up(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['SCHOOL_EDIT_ALL'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Permission SCHOOL_EDIT_ALL added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['SCHOOL_EDIT_ALL'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission SCHOOL_EDIT_ALL added to role superhero.');
		}
	}
}
