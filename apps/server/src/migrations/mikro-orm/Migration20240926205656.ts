import { Migration } from '@mikro-orm/migrations-mongodb';
import CryptoJs from 'crypto-js';

// eslint-disable-next-line no-process-env

export class Migration20240926205656 extends Migration {
	async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (AES_KEY) {
			const tools = await this.driver.aggregate('external-tools', [{ $match: { config_type: { $eq: 'lti11' } } }]);

			for await (const tool of tools) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (tool.config_secret) {
					// eslint-disable-next-line no-await-in-loop
					await this.driver.nativeUpdate(
						'external-tools',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
						{ _id: tool._id },
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
						{ $set: { config_secret: CryptoJs.AES.encrypt(tool.config_secret, AES_KEY).toString() } }
					);
				}
			}
			console.info(`Encrypt field config_secret with AES_KEY of the svs.`);
		} else {
			console.info(`FAILED: Encrypt field config_secret with AES_KEY of the svs. REASON: AES KEY is not provided.`);
		}
	}

	async down(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (AES_KEY) {
			const tools = await this.driver.aggregate('external-tools', [{ $match: { config_type: { $eq: 'lti11' } } }]);

			for await (const tool of tools) {
				if (tool) {
					// eslint-disable-next-line no-await-in-loop
					await this.driver.nativeUpdate(
						'external-tools',
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
						{ _id: tool._id },
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
						{ $set: { config_secret: CryptoJs.AES.decrypt(tool.config_secret, AES_KEY).toString(CryptoJs.enc.Utf8) } }
					);
				}
			}

			console.info(`Rollback: Encrypt field config_secret with AES_KEY of the svs.`);
		} else {
			console.info(`FAILED: Encrypt field config_secret with AES_KEY of the svs. REASON: AES KEY is not provided.`);
		}
	}
}
