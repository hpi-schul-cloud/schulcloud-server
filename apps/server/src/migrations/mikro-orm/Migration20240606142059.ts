import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240606142059 extends Migration {
	async up(): Promise<void> {
		const superheroRole = await this.driver.nativeUpdate(
			'roles',
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['INSTANCE_VIEW'],
					},
				},
			}
		);

		if (superheroRole.affectedRows > 0) {
			console.info('Permissions INSTANCE_VIEW was added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const superheroRole = await this.driver.nativeUpdate(
			'roles',
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['INSTANCE_VIEW'],
					},
				},
			}
		);

		if (superheroRole.affectedRows > 0) {
			console.info('Permissions INSTANCE_VIEW was removed to role superhero.');
		}
	}
}
