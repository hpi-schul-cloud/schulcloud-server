import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250121203707 extends Migration {
	async up(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'administrator' },
			{
				$addToSet: {
					permissions: {
						$each: ['MEDIA_SCHOOL_LICENSE_ADMIN'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Permission MEDIA_SCHOOL_LICENSE_ADMIN added to role administrator.');
		}
	}

	async down(): Promise<void> {
		const adminRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'administrator' },
			{
				$pull: {
					permissions: {
						$in: ['MEDIA_SCHOOL_LICENSE_ADMIN'],
					},
				},
			}
		);

		if (adminRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission MEDIA_SCHOOL_LICENSE_ADMIN added to role administrator.');
		}
	}
}
