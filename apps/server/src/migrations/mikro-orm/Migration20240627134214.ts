import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240627134214 extends Migration {
	async up(): Promise<void> {
		await this.driver.aggregate('school-external-tools', [
			{ $set: { isDeactivated: { $ifNull: ['$status.isDeactivated', false] } } },
			{ $unset: 'status' },
			{ $out: 'school-external-tools' },
		]);

		console.info(`'status.isDeactivated' has moved to 'isDeactivated' for all school-external-tools`);
	}

	async down(): Promise<void> {
		await this.driver.nativeUpdate(
			'school-external-tools',
			{ isDeactivated: true },
			{
				$set: {
					status: {
						isOutdatedOnScopeSchool: false,
						isDeactivated: true,
					},
				},
			}
		);

		await this.driver.nativeUpdate(
			'school-external-tools',
			{},
			{
				$unset: { isDeactivated: '' },
			}
		);

		console.info(`All school-external-tools were reverted to using 'status'`);
	}
}
