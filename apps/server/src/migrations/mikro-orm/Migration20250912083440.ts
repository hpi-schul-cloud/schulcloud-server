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
		//  --- Update secretAccessKey of storage providers ---
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const storageProviders = this.getCollection(storageProvidersCollectionName).find({});

		const numberOfUpdatedStorageProviders = await this.updateSecrets(
			storageProviders,
			['secretAccessKey'],
			S3_KEY,
			storageProvidersCollectionName
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

		const ldapSystems = this.getCollection(systemsCollectionName).find({
			'ldapConfig.searchUserPassword': { $ne: undefined },
		});

		const numberOfUpdatedLdapSystems = await this.updateSecrets(
			ldapSystems,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY,
			systemsCollectionName
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

		const oauthSystems = this.getCollection(systemsCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedOauthSystems = await this.updateSecrets(
			oauthSystems,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			systemsCollectionName
		);

		console.info(`Updated OAuth clientSecret of ${numberOfUpdatedOauthSystems} systems with new encryption function.`);

		// ----------------------------------------------------------------------------------

		// --- Update clientSecret of OIDC systems ---

		const oidcSystems = this.getCollection(systemsCollectionName).find({
			'oidcConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedOidcSystems = await this.updateSecrets(
			oidcSystems,
			['oidcConfig', 'clientSecret'],
			AES_KEY,
			systemsCollectionName
		);

		console.info(`Updated OIDC clientSecret of ${numberOfUpdatedOidcSystems} systems with new encryption function.`);

		// ----------------------------------------------------------------------------------

		// --- Update secret in LTI 1.1 tools ---
		const lti11Tools = this.getCollection(externalToolsCollectionName).find({
			config_type: 'lti11',
			config_secret: { $ne: undefined },
		});

		const numberOfUpdatedLti11Tools = await this.updateSecrets(
			lti11Tools,
			['config_secret'],
			AES_KEY,
			externalToolsCollectionName
		);

		console.info(`Updated LTI 1.1 tool secrets of ${numberOfUpdatedLti11Tools} tools with new encryption function.`);

		// ----------------------------------------------------------------------------------

		// --- Update secret of media-source-oauth-config ---
		const mediaSources = this.getCollection(mediaSourcesCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedMediaSourceOauthConfigs = await this.updateSecrets(
			mediaSources,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		console.info(
			`Updated OAuth clientSecret of ${numberOfUpdatedMediaSourceOauthConfigs} media sources with new encryption function.`
		);

		// ----------------------------------------------------------------------------------

		// --- Update username of media-source-vidis-config ---
		const mediaSourcesVidisWithUsername = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.username': { $ne: undefined },
		});

		const numberOfUpdatedMediaSourceVidisUsernames = await this.updateSecrets(
			mediaSourcesVidisWithUsername,
			['vidisConfig', 'username'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		console.info(
			`Updated Vidis username of ${numberOfUpdatedMediaSourceVidisUsernames} media sources with new encryption function.`
		);

		// ----------------------------------------------------------------------------------

		// --- Update password of media-source-vidis-config ---
		const mediaSourcesVidisWithPassword = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.password': { $ne: undefined },
		});

		const numberOfUpdatedMediaSourceVidisPasswords = await this.updateSecrets(
			mediaSourcesVidisWithPassword,
			['vidisConfig', 'password'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		console.info(
			`Updated Vidis password of ${numberOfUpdatedMediaSourceVidisPasswords} media sources with new encryption function.`
		);
	}

	public async down(): Promise<void> {
		// --- Revert update of secretAccessKey of storage providers ---
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const storageProviders = this.getCollection(storageProvidersCollectionName).find({});

		const numberOfUpdatedStorageProviders = await this.revertUpdateOfSecrets(
			storageProviders,
			['secretAccessKey'],
			S3_KEY,
			storageProvidersCollectionName
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

		const ldapSystems = this.getCollection(systemsCollectionName).find({
			'ldapConfig.searchUserPassword': { $ne: undefined },
		});

		const numberOfUpdatedLdapSystems = await this.revertUpdateOfSecrets(
			ldapSystems,
			['ldapConfig', 'searchUserPassword'],
			LDAP_PASSWORD_ENCRYPTION_KEY,
			systemsCollectionName
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

		const oauthSystems = this.getCollection(systemsCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedOauthSystems = await this.revertUpdateOfSecrets(
			oauthSystems,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			systemsCollectionName
		);

		console.info(`Reverted update of OAuth clientSecret of ${numberOfUpdatedOauthSystems} systems.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of clientSecret of OIDC systems ---
		const oidcSystems = this.getCollection(systemsCollectionName).find({
			'oidcConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedOidcSystems = await this.revertUpdateOfSecrets(
			oidcSystems,
			['oidcConfig', 'clientSecret'],
			AES_KEY,
			systemsCollectionName
		);

		console.info(`Reverted update of OIDC clientSecret of ${numberOfUpdatedOidcSystems} systems.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of secret in LTI 1.1 tools ---
		const lti11Tools = this.getCollection(externalToolsCollectionName).find({
			config_type: 'lti11',
			config_secret: { $ne: undefined },
		});

		const numberOfUpdatedLti11Tools = await this.revertUpdateOfSecrets(
			lti11Tools,
			['config_secret'],
			AES_KEY,
			externalToolsCollectionName
		);

		console.info(`Reverted update of LTI 1.1 tool secrets of ${numberOfUpdatedLti11Tools} tools.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of secret of media-source-oauth-config ---
		const mediaSources = this.getCollection(mediaSourcesCollectionName).find({
			'oauthConfig.clientSecret': { $ne: undefined },
		});

		const numberOfUpdatedMediaSourceOauthConfigs = await this.revertUpdateOfSecrets(
			mediaSources,
			['oauthConfig', 'clientSecret'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		console.info(`Reverted update of OAuth clientSecret of ${numberOfUpdatedMediaSourceOauthConfigs} media sources.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of username of media-source-vidis-config ---
		const mediaSourcesVidisWithUsername = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.username': { $ne: undefined },
		});

		const numberOfUpdatedMediaSourceVidisUsernames = await this.revertUpdateOfSecrets(
			mediaSourcesVidisWithUsername,
			['vidisConfig', 'username'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		console.info(`Reverted update of Vidis username of ${numberOfUpdatedMediaSourceVidisUsernames} media sources.`);

		// ----------------------------------------------------------------------------------

		// --- Revert update of password of media-source-vidis-config ---
		const mediaSourcesVidisWithPassword = this.getCollection(mediaSourcesCollectionName).find({
			'vidisConfig.password': { $ne: undefined },
		});

		const numberOfUpdatedMediaSourceVidisPasswords = await this.revertUpdateOfSecrets(
			mediaSourcesVidisWithPassword,
			['vidisConfig', 'password'],
			AES_KEY,
			mediaSourcesCollectionName
		);

		console.info(`Reverted update of Vidis password of ${numberOfUpdatedMediaSourceVidisPasswords} media sources.`);
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
