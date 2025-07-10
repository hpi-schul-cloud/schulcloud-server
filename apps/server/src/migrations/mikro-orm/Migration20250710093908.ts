import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';
import CryptoJS from 'crypto-js';

type System = {
	_id: ObjectId;
	ldapConfig: {
		searchUserPassword: string;
	};
};

// Update AES encrypted searchUserPassword of LDAP systems with new encryption function.
export class Migration20250710093908 extends Migration {
	public async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { LDAP_PASSWORD_ENCRYPTION_KEY } = process.env;

		if (!LDAP_PASSWORD_ENCRYPTION_KEY) {
			console.error('LDAP_PASSWORD_ENCRYPTION_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const systems = this.getCollection<System>('systems').find({ 'ldapConfig.searchUserPassword': { $ne: undefined } });

		let numberOfUpdatedSystems = 0;

		for await (const system of systems) {
			const decrypted = CryptoJS.AES.decrypt(
				system.ldapConfig.searchUserPassword,
				LDAP_PASSWORD_ENCRYPTION_KEY
			).toString(CryptoJS.enc.Utf8);
			const encrypted = AesEncryptionHelper.encrypt(decrypted, LDAP_PASSWORD_ENCRYPTION_KEY);

			await this.getCollection('systems').updateOne(
				{ _id: system._id },
				{ $set: { 'ldapConfig.searchUserPassword': encrypted } }
			);

			numberOfUpdatedSystems += 1;
		}

		console.info(`Updated LDAP searchUserPassword of ${numberOfUpdatedSystems} systems with new encryption function.`);
	}

	public async down(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { LDAP_PASSWORD_ENCRYPTION_KEY } = process.env;

		if (!LDAP_PASSWORD_ENCRYPTION_KEY) {
			console.error('LDAP_PASSWORD_ENCRYPTION_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const systems = this.getCollection<System>('systems').find({ 'ldapConfig.searchUserPassword': { $ne: undefined } });

		let numberOfUpdatedSystems = 0;

		for await (const system of systems) {
			const decrypted = AesEncryptionHelper.decrypt(system.ldapConfig.searchUserPassword, LDAP_PASSWORD_ENCRYPTION_KEY);
			const encrypted = CryptoJS.AES.encrypt(decrypted, LDAP_PASSWORD_ENCRYPTION_KEY).toString();

			await this.getCollection('systems').updateOne(
				{ _id: system._id },
				{ $set: { 'ldapConfig.searchUserPassword': encrypted } }
			);

			numberOfUpdatedSystems += 1;
		}

		console.info(`Reverted update of LDAP searchUserPassword of ${numberOfUpdatedSystems} systems.`);
	}
}
