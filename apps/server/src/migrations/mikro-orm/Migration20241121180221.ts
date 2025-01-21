import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20241121180221 extends Migration {
	async up(): Promise<void> {
		await this.driver.nativeInsert('roles', {
			name: 'groupSubstitutionTeacher',
			roles: [],
			permissions: [],
		});

		// eslint-disable-next-line no-console
		console.info('Added groupSubstitutionTeacher role');
	}

	async down(): Promise<void> {
		await this.driver.nativeDelete('roles', { name: 'groupSubstitutionTeacher' });

		// eslint-disable-next-line no-console
		console.info('Rollback: Removed groupSubstitutionTeacher role');
	}
}
