import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240819123013 extends Migration {
	async up(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['COURSE_ADMINISTRATION'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Permission COURSE_ADMINISTRATION was added to role administrator.');
		}
	}

	async down(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['COURSE_ADMINISTRATION'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Removed permission COURSE_ADMINISTRATION from role administrator.');
		}
	}
}
