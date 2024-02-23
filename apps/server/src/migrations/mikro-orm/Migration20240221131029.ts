import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240221131029 extends Migration {
	async up(): Promise<void> {
		const contextExternalToolResponse = await this.driver.nativeUpdate(
			'external-tools',
			{ config_type: 'lti11' },
			{ $unset: { config_resource_link_id: '' } }
		);

		console.info(`Removed ${contextExternalToolResponse.affectedRows} resource_link_id(s) in context-external-tools`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		// do nothing
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
