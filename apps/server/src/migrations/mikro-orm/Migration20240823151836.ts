import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240823151836 extends Migration {
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
			console.info('Permission COURSE_ADMINISTRATION added to role administrator.');
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
			console.info('Rollback: Permission COURSE_ADMINISTRATION added to role administrator.');
		}
	}
}
