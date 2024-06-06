import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240606142059 extends Migration {
	async up(): Promise<void> {
		const userRole = await this.driver.nativeUpdate(
			'roles',
			{ name: 'user' },
			{
				$addToSet: {
					permissions: {
						$each: ['FILESTORAGE_WRITE_SCHOOL'],
					},
				},
			}
		);

		const superheroRole = await this.driver.nativeUpdate(
			'roles',
			{ name: 'superhero' },
			{
				$addToSet: {
					permissions: {
						$each: ['FILESTORAGE_WRITE_INSTANCE'],
					},
				},
			}
		);

		if (userRole.affectedRows > 0) {
			console.info('Permissions FILESTORAGE_WRITE_SCHOOL was added to role user.');
		}

		if (superheroRole.affectedRows > 0) {
			console.info('Permissions FILESTORAGE_WRITE_INSTANCE was added to role superhero.');
		}
	}

	async down(): Promise<void> {
		const userRole = await this.driver.nativeUpdate(
			'roles',
			{ name: 'user' },
			{
				$pull: {
					permissions: {
						$in: ['FILESTORAGE_WRITE_SCHOOL'],
					},
				},
			}
		);

		const superheroRole = await this.driver.nativeUpdate(
			'roles',
			{ name: 'superhero' },
			{
				$pull: {
					permissions: {
						$in: ['FILESTORAGE_WRITE_INSTANCE'],
					},
				},
			}
		);

		if (userRole.affectedRows > 0) {
			console.info('Permissions FILESTORAGE_WRITE_SCHOOL was removed to role user.');
		}

		if (superheroRole.affectedRows > 0) {
			console.info('Permissions FILESTORAGE_WRITE_INSTANCE was removed to role superhero.');
		}
	}
}
