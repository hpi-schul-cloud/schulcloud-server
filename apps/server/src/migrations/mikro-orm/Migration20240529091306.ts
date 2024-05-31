import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240529091306 extends Migration {
	async up(): Promise<void> {
		const systemOptions = await this.driver.nativeUpdate(
			'school-system-options',
			{},
			{ $set: { 'provisioningOptions.schoolExternalToolProvisioningEnabled': false } }
		);

		console.info(
			`schoolExternalToolProvisioningEnabled was added to ${systemOptions.affectedRows} school system options`
		);
	}

	async down(): Promise<void> {
		const systemOptions = await this.driver.nativeUpdate(
			'school-system-options',
			{},
			{ $unset: { 'provisioningOptions.schoolExternalToolProvisioningEnabled': '' } }
		);

		console.info(
			`schoolExternalToolProvisioningEnabled was removed from ${systemOptions.affectedRows} school system options`
		);
	}
}
