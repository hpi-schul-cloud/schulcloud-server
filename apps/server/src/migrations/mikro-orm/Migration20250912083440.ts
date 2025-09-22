import { Migration } from '@mikro-orm/migrations-mongodb';
import { FindCursor, WithId } from '@mikro-orm/mongodb/node_modules/mongodb';
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
		const storageProviders = this.getCollection(storageProvidersCollectionName).find({});

		await this.updateSecrets(storageProviders, ['secretAccessKey'], S3_KEY, storageProvidersCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Update searchUserPassword of LDAP systems ---
		const ldapSystems = this.getCollection(systemsCollectionName).find({
			'ldapConfig.searchUserPassword': { $ne: undefined },
		});

		await this.updateSecrets(
			ldapSystems,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY,
			systemsCollectionName
		);

		// ----------------------------------------------------------------------------------

		// --- Update clientSecret of OAuth systems ---
		const oauthSystems = this.getCollection(systemsCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		await this.updateSecrets(oauthSystems, ['oauthConfig', 'clientSecret'], AES_KEY, systemsCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Update clientSecret of OIDC systems ---

		const oidcSystems = this.getCollection(systemsCollectionName).find({
			'oidcConfig.clientSecret': { $ne: undefined },
		});

		await this.updateSecrets(oidcSystems, ['oidcConfig', 'clientSecret'], AES_KEY, systemsCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Update secret in LTI 1.1 tools ---
		const lti11Tools = this.getCollection(externalToolsCollectionName).find({
			config_type: 'lti11',
			config_secret: { $ne: undefined },
		});

		await this.updateSecrets(lti11Tools, ['config_secret'], AES_KEY, externalToolsCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Update secret of media-source-oauth-config ---
		const mediaSources = this.getCollection(mediaSourcesCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		await this.updateSecrets(mediaSources, ['oauthConfig', 'clientSecret'], AES_KEY, mediaSourcesCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Update username of media-source-vidis-config ---
		const mediaSourcesVidisWithUsername = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.username': { $ne: undefined },
		});

		await this.updateSecrets(
			mediaSourcesVidisWithUsername,
			['vidisConfig', 'username'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		// ----------------------------------------------------------------------------------

		// --- Update password of media-source-vidis-config ---
		const mediaSourcesVidisWithPassword = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.password': { $ne: undefined },
		});

		await this.updateSecrets(
			mediaSourcesVidisWithPassword,
			['vidisConfig', 'password'],
			AES_KEY,
			mediaSourcesCollectionName
		);
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
		const storageProviders = this.getCollection(storageProvidersCollectionName).find({});

		await this.revertUpdateOfSecrets(storageProviders, ['secretAccessKey'], S3_KEY, storageProvidersCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Revert update of searchUserPassword of LDAP systems ---
		const ldapSystems = this.getCollection(systemsCollectionName).find({
			'ldapConfig.searchUserPassword': { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(
			ldapSystems,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY,
			systemsCollectionName
		);

		// ----------------------------------------------------------------------------------

		// --- Revert update of clientSecret of OAuth systems ---
		const oauthSystems = this.getCollection(systemsCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(oauthSystems, ['oauthConfig', 'clientSecret'], AES_KEY, systemsCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Revert update of clientSecret of OIDC systems ---
		const oidcSystems = this.getCollection(systemsCollectionName).find({
			'oidcConfig.clientSecret': { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(oidcSystems, ['oidcConfig', 'clientSecret'], AES_KEY, systemsCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Revert update of secret in LTI 1.1 tools ---
		const lti11Tools = this.getCollection(externalToolsCollectionName).find({
			config_type: 'lti11',
			config_secret: { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(lti11Tools, ['config_secret'], AES_KEY, externalToolsCollectionName);

		// ----------------------------------------------------------------------------------

		// --- Revert update of secret of media-source-oauth-config ---
		const mediaSources = this.getCollection(mediaSourcesCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(
			mediaSources,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		// ----------------------------------------------------------------------------------

		// --- Revert update of username of media-source-vidis-config ---
		const mediaSourcesVidisWithUsername = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.username': { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(
			mediaSourcesVidisWithUsername,
			['vidisConfig', 'username'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		// ----------------------------------------------------------------------------------

		// --- Revert update of password of media-source-vidis-config ---
		const mediaSourcesVidisWithPassword = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.password': { $ne: undefined },
		});

		await this.revertUpdateOfSecrets(
			mediaSourcesVidisWithPassword,
			['vidisConfig', 'password'],
			AES_KEY,
			mediaSourcesCollectionName
		);
	}

	private async updateSecrets<T>(
		cursor: FindCursor<WithId<T>>,
		path: Array<string>,
		key: string,
		collectionName: string
	): Promise<void> {
		let numberOfUpdatedSecrets = 0;
		let numberOfFailedUpdates = 0;

		for await (const item of cursor) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				const secret = path.reduce((acc, part) => acc[part], item) as unknown as string;
				const decrypted = CryptoJS.AES.decrypt(secret, key).toString(CryptoJS.enc.Utf8);
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

	private async revertUpdateOfSecrets<T>(
		cursor: FindCursor<WithId<T>>,
		path: Array<string>,
		key: string,
		collectionName: string
	): Promise<void> {
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
