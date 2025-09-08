import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20250227212150 extends Migration {
	async up(): Promise<void> {
		const superheroRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['MEDIA_SOURCE_ADMIN'],
					},
				},
			}
		);

		if (superheroRoleUpdate.modifiedCount > 0) {
			console.info('Permission MEDIA_SOURCE_ADMIN added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const superheroRoleUpdate = await this.getCollection('roles').updateOne(
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['MEDIA_SOURCE_ADMIN'],
					},
				},
			}
		);

		if (superheroRoleUpdate.modifiedCount > 0) {
			console.info('Rollback: Permission MEDIA_SOURCE_ADMIN added to role superhero.');
		}
	}
}
