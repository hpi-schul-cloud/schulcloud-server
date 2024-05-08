import { Configuration } from '@hpi-schul-cloud/commons';
import { DatabaseManagementService } from '@infra/database';
import { DefaultEncryptionService, EncryptionService, LdapEncryptionService } from '@infra/encryption';
import { FileSystemAdapter } from '@infra/file-system';
import { UmzugMigration } from '@mikro-orm/migrations-mongodb';
import { EntityManager } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProviderEntity, SystemEntity } from '@shared/domain/entity';
import { LegacyLogger } from '@src/core/logger';
import { orderBy } from 'lodash';
import { BsonConverter } from '../converter/bson.converter';
import { generateSeedData } from '../seed-data/generateSeedData';

export interface CollectionFilePath {
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
		private readonly logger: LegacyLogger,
		private em: EntityManager,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: EncryptionService,
		@Inject(LdapEncryptionService) private readonly ldapEncryptionService: EncryptionService
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
	 * @returns {CollectionFilePath}
	 */
	private async loadAllCollectionsFromDatabase(targetFolder: string): Promise<CollectionFilePath[]> {
		const collections = await this.databaseManagementService.getCollectionNames();
		const collectionsWithFilePaths = collections.map((collectionName) => {
			return {
				filePath: this.fileSystemAdapter.joinPath(targetFolder, `${collectionName}.json`),
				collectionName,
			};
		});
		return collectionsWithFilePaths;
	}

	/**
	 * Loads all collection names and file paths from backup files.
	 * @returns {CollectionFilePath}
	 */
	private async loadAllCollectionsFromFilesystem(baseDir: string): Promise<CollectionFilePath[]> {
		const filenames = await this.fileSystemAdapter.readDir(baseDir);
		const collectionsWithFilePaths = filenames.map((fileName) => {
			return {
				filePath: this.fileSystemAdapter.joinPath(baseDir, fileName),
				collectionName: fileName.split('.')[0],
			};
		});
		return collectionsWithFilePaths;
	}

	/**
	 * Scans <source> for existing collections and optionally filters them based on <collectionNameFilter>
	 * @param source
	 * @param collectionNameFilter
	 * @returns {CollectionFilePath} the filtered collection names and related file paths
	 */
	private async loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
		source: 'files' | 'database',
		folder: string,
		collectionNameFilter?: string[]
	) {
		let allCollectionsWithFilePaths: CollectionFilePath[] = [];

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

	private async dropCollectionIfExists(collectionName: string) {
		const collectionExists = await this.databaseManagementService.collectionExists(collectionName);
		if (collectionExists) {
			// clear existing documents, if collection exists
			await this.databaseManagementService.clearCollection(collectionName);
		} else {
			// create collection
			await this.databaseManagementService.createCollection(collectionName);
		}
	}

	async seedDatabaseCollectionsFromFactories(collections?: string[]): Promise<string[]> {
		const promises = generateSeedData((s: string) => this.injectEnvVars(s))
			.filter((data) => {
				if (collections && collections.length > 0) {
					return collections.includes(data.collectionName);
				}
				return true;
			})
			.map(async ({ collectionName, data }) => {
				if (collectionName === systemsCollectionName) {
					this.encryptSecretsInSystems(data as SystemEntity[]);
				}
				await this.dropCollectionIfExists(collectionName);

				await this.em.persistAndFlush(data);

				return `${collectionName}:${data.length}`;
			});

		const seededCollectionsWithAmount = await Promise.all(promises);

		return seededCollectionsWithAmount;
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
		await Promise.all([this.createUserSearchIndex(), await this.createTSPOptions()]);
		return this.databaseManagementService.syncIndexes();
	}

	private async createTSPOptions() {
		const usersCollection = this.databaseManagementService.getDatabaseCollection('users');

		await usersCollection.createIndex(
			{ 'sourceOptions.tspUid': 1 },
			{
				name: 'sourceOptions.tspUid',
				unique: true,
				partialFilterExpression: { 'sourceOptions.tspUid': { $exists: true } },
			}
		);
	}

	private async createUserSearchIndex(): Promise<void> {
		const usersCollection = this.databaseManagementService.getDatabaseCollection('users');
		const userSearchIndexExists = await usersCollection.indexExists('userSearchIndex');
		const indexes = await usersCollection.indexes();

		if (userSearchIndexExists) {
			const userSearchIndex = indexes.filter((i) => i.name === 'userSearchIndex');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (userSearchIndex[0].key?.schoolId === 1) {
				this.logger.debug('userSearcIndex does not require update');
				return;
			}
			await usersCollection.dropIndex('userSearchIndex');
		}

		await usersCollection.createIndex(
			{
				firstName: 'text',
				lastName: 'text',
				email: 'text',
				firstNameSearchValues: 'text',
				lastNameSearchValues: 'text',
				emailSearchValues: 'text',
				schoolId: 1,
			},
			{
				name: 'userSearchIndex',
				weights: {
					firstName: 15,
					lastName: 15,
					email: 15,
					firstNameSearchValues: 3,
					lastNameSearchValues: 3,
					emailSearchValues: 2,
				},
				default_language: 'none', // no stop words and no stemming,
				language_override: 'de',
			}
		);
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
			this.encryptSecretsInSystems(jsonDocuments as SystemEntity[]);
		}
	}

	private encryptSecretsInSystems(systems: SystemEntity[]) {
		systems.forEach((system) => {
			if (system.oauthConfig) {
				system.oauthConfig.clientSecret = this.defaultEncryptionService.encrypt(system.oauthConfig.clientSecret);
			}
			if (system.oidcConfig) {
				system.oidcConfig.clientSecret = this.defaultEncryptionService.encrypt(system.oidcConfig.clientSecret);
			}
			if (system.ldapConfig) {
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
			this.removeSecretsFromSystems(jsonDocuments as SystemEntity[]);
		}
		if (collectionName === storageprovidersCollectionName) {
			this.removeSecretsFromStorageproviders(jsonDocuments as StorageProviderEntity[]);
		}
	}

	private removeSecretsFromStorageproviders(storageProviders: StorageProviderEntity[]) {
		storageProviders.forEach((storageProvider) => {
			storageProvider.accessKeyId = defaultSecretReplacementHintText;
			storageProvider.secretAccessKey = defaultSecretReplacementHintText;
		});
	}

	private removeSecretsFromSystems(systems: SystemEntity[]) {
		systems.forEach((system) => {
			if (system.oauthConfig) {
				system.oauthConfig.clientSecret = defaultSecretReplacementHintText;
			}
			if (system.oidcConfig) {
				system.oidcConfig.clientSecret = defaultSecretReplacementHintText;
			}
			if (system.ldapConfig) {
				system.ldapConfig.searchUserPassword = defaultSecretReplacementHintText;
			}
		});
		return systems;
	}

	public async migrationUp(from?: string, to?: string, only?: string): Promise<void> {
		return this.databaseManagementService.migrationUp(from, to, only);
	}

	public async migrationDown(from?: string, to?: string, only?: string): Promise<void> {
		return this.databaseManagementService.migrationDown(from, to, only);
	}

	public async migrationPending(): Promise<UmzugMigration[]> {
		return this.databaseManagementService.migrationPending();
	}
}
