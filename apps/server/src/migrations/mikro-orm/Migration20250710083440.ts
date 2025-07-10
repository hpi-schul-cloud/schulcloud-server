import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { FindCursor, WithId } from '@mikro-orm/mongodb/node_modules/mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';
import CryptoJS from 'crypto-js';

type StorageProvider = {
	_id: ObjectId;
	secretAccessKey: string;
};

type LdapSystem = {
	_id: ObjectId;
	ldapConfig: {
		searchUserPassword: string;
	};
};

type OauthSystem = {
	_id: ObjectId;
	oauthConfig: {
		clientSecret: string;
	};
};

// Update all AES encrypted secrets with new encryption function.
export class Migration20250710083440 extends Migration {
	public async up(): Promise<void> {
		//  --- Update secretAccessKey of storage providers ---
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const storageProviders = this.getCollection<StorageProvider>('storageproviders').find({});

		const numberOfUpdatedStorageProviders = await this.updateSecrets(
			storageProviders,
			['secretAccessKey'],
			S3_KEY,
			'storageproviders'
		);

		console.info(
			`Updated secretAccessKey of ${numberOfUpdatedStorageProviders} storage providers with new encryption function.`
		);

		// ----------------------------------------------------------------------------------

		// --- Update searchUserPassword of LDAP systems ---
		// eslint-disable-next-line no-process-env
		const { LDAP_PASSWORD_ENCRYPTION_KEY } = process.env;

		if (!LDAP_PASSWORD_ENCRYPTION_KEY) {
			console.error('LDAP_PASSWORD_ENCRYPTION_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const ldapSystems = this.getCollection<LdapSystem>('systems').find({
			'ldapConfig.searchUserPassword': { $ne: undefined },
		});

		const numberOfUpdatedLdapSystems = await this.updateSecrets(
			ldapSystems,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY,
			'systems'
		);

		console.info(
			`Updated LDAP searchUserPassword of ${numberOfUpdatedLdapSystems} systems with new encryption function.`
		);

		// ----------------------------------------------------------------------------------

		// --- Update clientSecret of OAuth systems ---
		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const oauthSystems = this.getCollection<OauthSystem>('systems').find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedOauthSystems = await this.updateSecrets(
			oauthSystems,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			'systems'
		);

		console.info(`Updated OAuth clientSecret of ${numberOfUpdatedOauthSystems} systems with new encryption function.`);
	}

	public async down(): Promise<void> {
		// --- Revert update of secretAccessKey of storage providers ---
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const storageProviders = this.getCollection<StorageProvider>('storageproviders').find({});

		const numberOfUpdatedStorageProviders = await this.revertUpdateOfSecrets(
			storageProviders,
			['secretAccessKey'],
			S3_KEY,
			'storageproviders'
		);

		console.info(`Reverted update of secretAccessKey of ${numberOfUpdatedStorageProviders} storage providers.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of searchUserPassword of LDAP systems ---
		// eslint-disable-next-line no-process-env
		const { LDAP_PASSWORD_ENCRYPTION_KEY } = process.env;

		if (!LDAP_PASSWORD_ENCRYPTION_KEY) {
			console.error('LDAP_PASSWORD_ENCRYPTION_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const ldapSystems = this.getCollection<LdapSystem>('systems').find({
			'ldapConfig.searchUserPassword': { $ne: undefined },
		});

		const numberOfUpdatedLdapSystems = await this.revertUpdateOfSecrets(
			ldapSystems,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY,
			'systems'
		);

		console.info(`Reverted update of LDAP searchUserPassword of ${numberOfUpdatedLdapSystems} systems.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of clientSecret of OAuth systems ---
		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const oauthSystems = this.getCollection<OauthSystem>('systems').find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedOauthSystems = await this.revertUpdateOfSecrets(
			oauthSystems,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			'systems'
		);

		console.info(`Reverted update of OAuth clientSecret of ${numberOfUpdatedOauthSystems} systems.`);
	}

	private async updateSecrets<T>(
		cursor: FindCursor<WithId<T>>,
		path: Array<string>,
		key: string,
		collectionName: string
	): Promise<number> {
		let numberOfUpdatedSecrets = 0;

		for await (const item of cursor) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			const secret = path.reduce((acc, part) => acc[part], item) as unknown as string;
			const decrypted = CryptoJS.AES.decrypt(secret, key).toString(CryptoJS.enc.Utf8);
			const encrypted = AesEncryptionHelper.encrypt(decrypted, key);

			await this.getCollection(collectionName).updateOne({ _id: item._id }, { $set: { [path.join('.')]: encrypted } });

			numberOfUpdatedSecrets += 1;
		}

		return numberOfUpdatedSecrets;
	}

	private async revertUpdateOfSecrets<T>(
		cursor: FindCursor<WithId<T>>,
		path: Array<string>,
		key: string,
		collectionName: string
	): Promise<number> {
		let numberOfUpdatedSecrets = 0;

		for await (const item of cursor) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			const secret = path.reduce((acc, part) => acc[part], item) as unknown as string;
			const decrypted = AesEncryptionHelper.decrypt(secret, key);
			const encrypted = CryptoJS.AES.encrypt(decrypted, key).toString();

			await this.getCollection(collectionName).updateOne({ _id: item._id }, { $set: { [path.join('.')]: encrypted } });

			numberOfUpdatedSecrets += 1;
		}

		return numberOfUpdatedSecrets;
	}
}
