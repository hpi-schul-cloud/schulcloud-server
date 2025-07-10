import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';
import CryptoJS from 'crypto-js';

type System = {
	_id: ObjectId;
	oauthConfig: {
		clientSecret: string;
	};
};

export class Migration20250710102124 extends Migration {
	public async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const systems = this.getCollection<System>('systems').find({ 'oauthConfig.clientSecret': { $ne: undefined } });

		let numberOfUpdatedSystems = 0;

		for await (const system of systems) {
			const decrypted = CryptoJS.AES.decrypt(system.oauthConfig.clientSecret, AES_KEY).toString(CryptoJS.enc.Utf8);
			const encrypted = AesEncryptionHelper.encrypt(decrypted, AES_KEY);

			await this.getCollection('systems').updateOne(
				{ _id: system._id },
				{ $set: { 'oauthConfig.clientSecret': encrypted } }
			);

			numberOfUpdatedSystems += 1;
		}

		console.info(`Updated OAuth clientSecret of ${numberOfUpdatedSystems} systems with new encryption function.`);
	}

	public async down(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const systems = this.getCollection<System>('systems').find({ 'oauthConfig.clientSecret': { $ne: undefined } });

		let numberOfUpdatedSystems = 0;

		for await (const system of systems) {
			const decrypted = AesEncryptionHelper.decrypt(system.oauthConfig.clientSecret, AES_KEY);
			const encrypted = CryptoJS.AES.encrypt(decrypted, AES_KEY).toString();

			await this.getCollection('systems').updateOne(
				{ _id: system._id },
				{ $set: { 'oauthConfig.clientSecret': encrypted } }
			);

			numberOfUpdatedSystems += 1;
		}

		console.info(`Reverted update of OAuth clientSecret of ${numberOfUpdatedSystems} systems.`);
	}
}
