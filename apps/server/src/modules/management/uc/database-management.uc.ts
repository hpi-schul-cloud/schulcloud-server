/* eslint-disable no-await-in-loop */

import { Inject, Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';
import { FileSystemAdapter } from '@shared/infra/file-system';
import { DatabaseManagementService } from '@shared/infra/database';
import { Configuration } from '@hpi-schul-cloud/commons';
import { DefaultEncryptionService, IEncryptionService, LdapEncryptionService } from '@shared/infra/encryption';
import { StorageProvider, System } from '@shared/domain';
import { SysType } from '@shared/infra/identity-management';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { BsonConverter } from '../converter/bson.converter';

export interface ICollectionFilePath {
	filePath: string;
	collectionName: string;
}

const systemsCollectionName = 'systems';
const storageprovidersCollectionName = 'storageproviders';

const defaultSecretReplacementHintText = 'replace with secret placeholder';

@Injectable()
export class DatabaseManagementUc {
	/**
	 * relative path to seed data folder based of location of this file.
	 */
	private basePath = '../../../../../../backup';

	constructor(
		private fileSystemAdapter: FileSystemAdapter,
		private databaseManagementService: DatabaseManagementService,
		private bsonConverter: BsonConverter,
		private readonly configService: ConfigService,
		private readonly logger: Logger,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: IEncryptionService,
		@Inject(LdapEncryptionService) private readonly ldapEncryptionService: IEncryptionService
	) {
		this.logger.setContext(DatabaseManagementUc.name);
	}

	/**
	 * absolute path reference for seed data base folder.
	 */
	private get baseDir(): string {
		const folderPath = this.fileSystemAdapter.joinPath(__dirname, this.basePath);
		return folderPath;
	}

	/**
	 * setup dir with json files
	 */
	private getSeedFolder() {
		return this.fileSystemAdapter.joinPath(this.baseDir, 'setup');
	}

	/**
	 * export folder name based on current date
	 * @returns
	 */
	private getTargetFolder(toSeedFolder?: boolean) {
		if (toSeedFolder === true) {
			const targetFolder = this.getSeedFolder();
			return targetFolder;
		}
		const now = new Date();
		const currentDateTime = `${now.getFullYear()}_${
			now.getMonth() + 1
		}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
		const targetFolder = this.fileSystemAdapter.joinPath(this.baseDir, currentDateTime);
		return targetFolder;
	}

	/**
	 * Loads all collection names from database and adds related file paths.
	 * @returns {ICollectionFilePath}
	 */
	private async loadAllCollectionsFromDatabase(targetFolder: string): Promise<ICollectionFilePath[]> {
		const collections = await this.databaseManagementService.getCollectionNames();
		const collectionsWithFilePaths = collections.map((collectionName) => ({
			filePath: this.fileSystemAdapter.joinPath(targetFolder, `${collectionName}.json`),
			collectionName,
		}));
		return collectionsWithFilePaths;
	}

	/**
	 * Loads all collection names and file paths from backup files.
	 * @returns {ICollectionFilePath}
	 */
	private async loadAllCollectionsFromFilesystem(baseDir: string): Promise<ICollectionFilePath[]> {
		const filenames = await this.fileSystemAdapter.readDir(baseDir);
		const collectionsWithFilePaths = filenames.map((fileName) => ({
			filePath: this.fileSystemAdapter.joinPath(baseDir, fileName),
			collectionName: fileName.split('.')[0],
		}));
		return collectionsWithFilePaths;
	}

	/**
	 * Scans <source> for existing collections and optionally filters them based on <collectionNameFilter>
	 * @param source
	 * @param collectionNameFilter
	 * @returns {ICollectionFilePath} the filtered collection names and related file paths
	 */
	private async loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
		source: 'files' | 'database',
		folder: string,
		collectionNameFilter?: string[]
	) {
		let allCollectionsWithFilePaths: ICollectionFilePath[] = [];

		// load all available collections from source
		if (source === 'files') {
			allCollectionsWithFilePaths = await this.loadAllCollectionsFromFilesystem(folder);
		} else {
			// source === 'database'
			allCollectionsWithFilePaths = await this.loadAllCollectionsFromDatabase(folder);
		}

		// when a collection name filter is given, apply it and check
		if (Array.isArray(collectionNameFilter) && collectionNameFilter.length > 0) {
			const filteredCollectionsWithFilePaths = allCollectionsWithFilePaths.filter(({ collectionName }) =>
				collectionNameFilter?.includes(collectionName)
			);

			if (filteredCollectionsWithFilePaths.length !== collectionNameFilter.length) {
				throw new Error(
					`At least one collectionName of ${JSON.stringify(
						collectionNameFilter
					)} is invalid. Collection names available in '${source}' are: ${JSON.stringify(
						allCollectionsWithFilePaths.map((file) => file.collectionName)
					)}`
				);
			}

			return filteredCollectionsWithFilePaths;
		}

		return allCollectionsWithFilePaths;
	}

	/**
	 * Imports all or filtered <collections> from filesystem as bson to database.
	 * The behaviour should match $ mongoimport
	 * @param collections optional filter applied on existing collections
	 * @returns the list of collection names exported
	 */
	async seedDatabaseCollectionsFromFileSystem(collections?: string[]): Promise<string[]> {
		// detect collections to seed based on filesystem data
		const setupPath = this.getSeedFolder();
		const collectionsToSeed = await this.loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
			'files',
			setupPath,
			collections
		);

		const seededCollectionsWithAmount: string[] = [];

		await Promise.all(
			collectionsToSeed.map(async ({ filePath, collectionName }) => {
				// load text from backup file
				let fileContent = await this.fileSystemAdapter.readFile(filePath);

				if (collectionName === systemsCollectionName || collectionName === storageprovidersCollectionName) {
					fileContent = this.injectEnvVars(fileContent);
				}

				// create bson-objects from text
				const bsonDocuments = JSON.parse(fileContent) as unknown[];
				// deserialize bson (format of mongoexport) to json documents we can import to mongo
				const jsonDocuments = this.bsonConverter.deserialize(bsonDocuments);

				// hint: collection drop/create is very slow, delete all documents instead
				const collectionExists = await this.databaseManagementService.collectionExists(collectionName);
				if (collectionExists) {
					// clear existing documents, if collection exists
					await this.databaseManagementService.clearCollection(collectionName);
				} else {
					// create collection
					await this.databaseManagementService.createCollection(collectionName);
				}

				this.encryptSecrets(collectionName, jsonDocuments);

				// import backup data into database collection
				const importedDocumentsAmount = await this.databaseManagementService.importCollection(
					collectionName,
					jsonDocuments
				);
				// keep collection name and number of imported documents
				seededCollectionsWithAmount.push(`${collectionName}:${importedDocumentsAmount}`);
			})
		);
		return seededCollectionsWithAmount;
	}

	/**
	 * Exports all or defined <collections> from database as bson to filesystem.
	 * The behaviour should match $ mongoexport
	 * @param collections optional filter applied on existing collections
	 * @param toSeedFolder optional override existing seed data files
	 * @returns the list of collection names exported
	 */
	async exportCollectionsToFileSystem(collections?: string[], toSeedFolder?: boolean): Promise<string[]> {
		const targetFolder = this.getTargetFolder(toSeedFolder);
		await this.fileSystemAdapter.createDir(targetFolder);
		// detect collections to export based on database collections
		const collectionsToExport = await this.loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
			'database',
			targetFolder,
			collections
		);
		const exportedCollections: string[] = [];

		await Promise.all(
			collectionsToExport.map(async ({ filePath, collectionName }) => {
				// load json documents from collection
				const jsonDocuments = await this.databaseManagementService.findDocumentsOfCollection(collectionName);
				this.removeSecrets(collectionName, jsonDocuments);
				// serialize to bson (format of mongoexport)
				const bsonDocuments = this.bsonConverter.serialize(jsonDocuments);
				// sort results to have 'new' data added at documents end
				const sortedBsonDocuments = orderBy(bsonDocuments, ['_id.$oid', 'createdAt.$date'], ['asc', 'asc']);
				// convert to text
				const TAB = '	';
				const json = JSON.stringify(sortedBsonDocuments, undefined, TAB);
				// persist to filesystem
				await this.fileSystemAdapter.writeFile(filePath, json + this.fileSystemAdapter.EOL);
				// keep collection name and number of exported documents
				exportedCollections.push(`${collectionName}:${sortedBsonDocuments.length}`);
			})
		);
		return exportedCollections;
	}

	/**
	 * Updates the indexes in the database based on definitions in entities
	 */
	async syncIndexes(): Promise<void> {
		return this.databaseManagementService.syncIndexes();
	}

	private injectEnvVars(json: string): string {
		// replace ${VAR} with VAR content
		json = json.replace(/(?<!\\)\$\{(.*?)\}/g, (placeholder) =>
			this.resolvePlaceholder(placeholder.substring(2, placeholder.length - 1))
		);
		// replace \$ with $ (escaped placeholder sequence)
		json = json.replace(/\\\$/g, '$');
		return json;
	}

	private resolvePlaceholder(placeholder: string) {
		if (Configuration.has(placeholder)) {
			return Configuration.get(placeholder) as string;
		}
		const placeholderValue = this.configService.get<string>(placeholder);
		if (placeholderValue) {
			return placeholderValue;
		}
		this.logger.warn(`Placeholder "${placeholder}" could not be resolved!`);
		return '';
	}

	private encryptSecrets(collectionName: string, jsonDocuments: unknown[]) {
		if (collectionName === systemsCollectionName) {
			this.encryptSecretsInSystems(jsonDocuments as System[]);
		}
	}

	private encryptSecretsInSystems(systems: System[]) {
		systems.forEach((system) => {
			if (system.oauthConfig) {
				system.oauthConfig.clientSecret = this.defaultEncryptionService.encrypt(system.oauthConfig.clientSecret);
			}
			if (system.type === SysType.OIDC && system.config) {
				system.config.clientSecret = this.defaultEncryptionService.encrypt(system.config.clientSecret as string);
				system.config.clientId = this.defaultEncryptionService.encrypt(system.config.clientId as string);
			}
			if (system.type === SysType.LDAP && system.ldapConfig) {
				system.ldapConfig.searchUserPassword = this.ldapEncryptionService.encrypt(
					system.ldapConfig.searchUserPassword as string
				);
			}
		});
		return systems;
	}

	/**
	 * Removes all known secrets (hard coded) from the export.
	 * Manual replacement with the intend placeholders or value is mandatory.
	 * Currently this affects system and storageproviders collections.
	 */
	private removeSecrets(collectionName: string, jsonDocuments: unknown[]) {
		if (collectionName === systemsCollectionName) {
			this.removeSecretsFromSystems(jsonDocuments as System[]);
		}
		if (collectionName === storageprovidersCollectionName) {
			this.removeSecretsFromStorageproviders(jsonDocuments as StorageProvider[]);
		}
	}

	private removeSecretsFromStorageproviders(storageProviders: StorageProvider[]) {
		storageProviders.forEach((storageProvider) => {
			storageProvider.accessKeyId = defaultSecretReplacementHintText;
			storageProvider.secretAccessKey = defaultSecretReplacementHintText;
		});
	}

	private removeSecretsFromSystems(systems: System[]) {
		systems.forEach((system) => {
			if (system.oauthConfig) {
				system.oauthConfig.clientSecret = defaultSecretReplacementHintText;
			}
			if (system.type === SysType.OIDC && system.config) {
				system.config.clientSecret = defaultSecretReplacementHintText;
				system.config.clientId = defaultSecretReplacementHintText;
			}
			if (system.type === SysType.LDAP && system.ldapConfig) {
				system.ldapConfig.searchUserPassword = defaultSecretReplacementHintText;
			}
		});
		return systems;
	}
}
