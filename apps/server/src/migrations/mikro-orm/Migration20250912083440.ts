import { Migration } from '@mikro-orm/migrations-mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';
import CryptoJS from 'crypto-js';

const storageProvidersCollectionName = 'storageproviders';
const systemsCollectionName = 'systems';
const externalToolsCollectionName = 'external-tools';
const mediaSourcesCollectionName = 'media-sources';

// Update all AES encrypted secrets with new encryption function.
export class Migration20250710083440 extends Migration {
	public async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		// eslint-disable-next-line no-process-env
		const { LDAP_PASSWORD_ENCRYPTION_KEY } = process.env;

		if (!LDAP_PASSWORD_ENCRYPTION_KEY) {
			console.error('LDAP_PASSWORD_ENCRYPTION_KEY is not provided. Migration cannot proceed.');
			return;
		}

		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		//  --- Update secretAccessKey of storage providers ---

		await this.updateSecrets(storageProvidersCollectionName, ['secretAccessKey'], S3_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update searchUserPassword of LDAP systems ---

		await this.updateSecrets(systemsCollectionName, ['ldapConfig', 'searchUserPassword'], LDAP_PASSWORD_ENCRYPTION_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update clientSecret of OAuth systems ---

		await this.updateSecrets(systemsCollectionName, ['oauthConfig', 'clientSecret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update clientSecret of OIDC systems ---

		await this.updateSecrets(systemsCollectionName, ['oidcConfig', 'clientSecret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update secret in LTI 1.1 tools ---

		await this.updateSecrets(externalToolsCollectionName, ['config_secret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update secret of media-source-oauth-config ---

		await this.updateSecrets(mediaSourcesCollectionName, ['oauthConfig', 'clientSecret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update username of media-source-vidis-config ---

		await this.updateSecrets(mediaSourcesCollectionName, ['vidisConfig', 'username'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Update password of media-source-vidis-config ---

		await this.updateSecrets(mediaSourcesCollectionName, ['vidisConfig', 'password'], AES_KEY);
	}

	public async down(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		// eslint-disable-next-line no-process-env
		const { LDAP_PASSWORD_ENCRYPTION_KEY } = process.env;

		if (!LDAP_PASSWORD_ENCRYPTION_KEY) {
			console.error('LDAP_PASSWORD_ENCRYPTION_KEY is not provided. Migration cannot proceed.');
			return;
		}

		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		// --- Revert update of secretAccessKey of storage providers ---

		await this.revertUpdateOfSecrets(storageProvidersCollectionName, ['secretAccessKey'], S3_KEY);

		// ----------------------------------------------------------------------------------

		// --- Revert update of searchUserPassword of LDAP systems ---

		await this.revertUpdateOfSecrets(
			systemsCollectionName,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY
		);

		// ----------------------------------------------------------------------------------

		// --- Revert update of clientSecret of OAuth systems ---

		await this.revertUpdateOfSecrets(systemsCollectionName, ['oauthConfig', 'clientSecret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Revert update of clientSecret of OIDC systems ---

		await this.revertUpdateOfSecrets(systemsCollectionName, ['oidcConfig', 'clientSecret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Revert update of secret in LTI 1.1 tools ---

		await this.revertUpdateOfSecrets(externalToolsCollectionName, ['config_secret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Revert update of secret of media-source-oauth-config ---

		await this.revertUpdateOfSecrets(mediaSourcesCollectionName, ['oauthConfig', 'clientSecret'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Revert update of username of media-source-vidis-config ---

		await this.revertUpdateOfSecrets(mediaSourcesCollectionName, ['vidisConfig', 'username'], AES_KEY);

		// ----------------------------------------------------------------------------------

		// --- Revert update of password of media-source-vidis-config ---

		await this.revertUpdateOfSecrets(mediaSourcesCollectionName, ['vidisConfig', 'password'], AES_KEY);
	}

	private async updateSecrets(collectionName: string, path: Array<string>, key: string): Promise<void> {
		const cursor = this.getCollection(collectionName).find({ [path.join('.')]: { $ne: undefined } });

		let numberOfUpdatedSecrets = 0;
		let numberOfFailedUpdates = 0;

		for await (const item of cursor) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				const secret = path.reduce((acc, part) => acc[part], item) as unknown as string;
				const decrypted = CryptoJS.AES.decrypt(secret, key).toString(CryptoJS.enc.Utf8);

				if (!decrypted) {
					throw new Error('Decryption resulted in an empty string.');
				}

				const encrypted = AesEncryptionHelper.encrypt(decrypted, key);

				await this.getCollection(collectionName).updateOne(
					{ _id: item._id },
					{ $set: { [path.join('.')]: encrypted } }
				);

				numberOfUpdatedSecrets += 1;
			} catch (error) {
				numberOfFailedUpdates += 1;

				console.error(
					`Failed to update secret at path ${path.join(
						'.'
					)} for item with id ${item._id.toString()} in collection ${collectionName} with error:`,
					error
				);
			}
		}

		console.info(
			`Updated ${numberOfUpdatedSecrets} secrets and failed to update ${numberOfFailedUpdates} secrets in collection ${collectionName} at path ${path.join(
				'.'
			)}.`
		);
	}

	private async revertUpdateOfSecrets(collectionName: string, path: Array<string>, key: string): Promise<void> {
		const cursor = this.getCollection(collectionName).find({ [path.join('.')]: { $ne: undefined } });

		let numberOfUpdatedSecrets = 0;
		let numberOfFailedUpdates = 0;

		for await (const item of cursor) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				const secret = path.reduce((acc, part) => acc[part], item) as unknown as string;
				const decrypted = AesEncryptionHelper.decrypt(secret, key);
				const encrypted = CryptoJS.AES.encrypt(decrypted, key).toString();

				await this.getCollection(collectionName).updateOne(
					{ _id: item._id },
					{ $set: { [path.join('.')]: encrypted } }
				);

				numberOfUpdatedSecrets += 1;
			} catch (error) {
				numberOfFailedUpdates += 1;

				console.error(
					`Failed to revert secret at path ${path.join(
						'.'
					)} for item with id ${item._id.toString()} in collection ${collectionName} with error:`,
					error
				);
			}
		}

		console.info(
			`Reverted ${numberOfUpdatedSecrets} secrets and failed to revert ${numberOfFailedUpdates} secrets in collection ${collectionName} at path ${path.join(
				'.'
			)}.`
		);
	}
}
