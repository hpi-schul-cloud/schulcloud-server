import { Migration } from '@mikro-orm/migrations-mongodb';

export class Migration20240725143018 extends Migration {
	async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		if (process.env.SC_THEME !== 'n21') {
			return;
		}

		console.info(`Adding 'oauthProvisioningEnabled' school feature to schools with moin.schule system`);

		const moinSchuleSystem = await this.getCollection('systems').findOne({ alias: 'SANIS' });

		if (!moinSchuleSystem) {
			console.error('moin.schule system not found');
			return;
		}
		console.info(`moin.schule system ${moinSchuleSystem._id.toHexString()} found`);

		const addOauthFeatureToSchools = await this.driver.nativeUpdate(
			'schools',
			{ systems: moinSchuleSystem._id },
			{
				$addToSet: {
					features: {
						$each: ['oauthProvisioningEnabled'],
					},
				},
			}
		);

		console.info(`Added 'oauthProvisioningEnabled' school feature to ${addOauthFeatureToSchools.affectedRows} schools`);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async down(): Promise<void> {
		console.error(`Migration down not implemented. You might need to restore database from backup!`);
	}
}
