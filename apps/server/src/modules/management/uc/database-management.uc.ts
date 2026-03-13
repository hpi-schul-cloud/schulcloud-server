import { LegacyLogger } from '@core/logger';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { FileSystemAdapter } from '@infra/file-system';
import { UmzugMigration } from '@mikro-orm/migrations-mongodb';
import { EntityManager } from '@mikro-orm/mongodb';
import { StorageProviderEntity } from '@modules/school/repo';
import { SystemEntity } from '@modules/system/repo';
import { Inject, Injectable } from '@nestjs/common';
import { AesEncryptionHelper } from '@shared/common/utils';
import { orderBy } from 'lodash';
import { BsonConverter } from '../converter/bson.converter';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';
import { generateSeedData } from '../seed-data/generate-seed-data';
import {
	ExternalToolsSeedDataService,
	InstancesSeedDataService,
	MediaSourcesSeedDataService,
	SystemsSeedDataService,
} from '../service';
import { DatabaseManagementService } from '../service/database-management.service';
import { Document } from 'mongodb';

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
		@Inject(MANAGEMENT_SEED_DATA_CONFIG_TOKEN) private readonly config: ManagementSeedDataConfig,
		private readonly logger: LegacyLogger,
		private em: EntityManager,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: EncryptionService,
		private readonly mediaSourcesSeedDataService: MediaSourcesSeedDataService,
		private readonly systemsSeedDataService: SystemsSeedDataService,
		private readonly externalToolsSeedDataService: ExternalToolsSeedDataService,
		private readonly instancesSeedDataService: InstancesSeedDataService
	) {
		this.logger.setContext(DatabaseManagementUc.name);
	}

	/**
	 * absolute path reference for seed database folder.
	 */
	private get baseDir(): string {
		const folderPath = this.fileSystemAdapter.joinPath(__dirname, this.basePath);
		return folderPath;
	}

	/**
	 * setup dir with json files
	 */
	private getSeedFolder(): string {
		return this.fileSystemAdapter.joinPath(this.baseDir, 'setup');
	}

	/**
	 * export folder name based on current date
	 * @returns
	 */
	private getTargetFolder(toSeedFolder?: boolean): string {
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
	): Promise<CollectionFilePath[]> {
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

	private async dropCollectionIfExists(collectionName: string): Promise<void> {
		const collectionExists = await this.databaseManagementService.collectionExists(collectionName);
		if (collectionExists) {
			// clear existing documents, if collection exists
			await this.databaseManagementService.clearCollection(collectionName);
		} else {
			// create collection
			await this.databaseManagementService.createCollection(collectionName);
		}
	}

	public async seedDatabaseCollectionsFromFactories(collections?: string[]): Promise<string[]> {
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

				await this.em.persist(data).flush();

				return `${collectionName}:${data.length}`;
			});

		const seededCollectionsWithAmount = await Promise.all(promises);

		return seededCollectionsWithAmount;
	}

	/**
	 * Imports all or filtered <collections> from filesystem as bson to database.
	 * The behavior should match $ mongoimport
	 * @param collections optional filter applied on existing collections
	 * @returns the list of collection names exported
	 */
	public async seedDatabaseCollectionsFromFileSystem(collections?: string[]): Promise<string[]> {
		// detect collections to seed based on filesystem data
		const setupPath = this.getSeedFolder();
		const collectionsToSeed = await this.loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
			'files',
			setupPath,
			collections
		);

		const seededCollectionsWithAmount: Map<string, number> = new Map();

		await Promise.all(
			collectionsToSeed.map(async ({ filePath, collectionName }) => {
				// load text from backup file
				let fileContent = await this.fileSystemAdapter.readFile(filePath);

				if (collectionName === systemsCollectionName || collectionName === storageprovidersCollectionName) {
					fileContent = this.injectEnvVars(fileContent);
				}

				// create bson-objects from text
				const bsonDocuments = JSON.parse(fileContent) as object[];
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
					jsonDocuments as Document[]
				);
				// keep collection name and number of imported documents
				seededCollectionsWithAmount.set(collectionName, importedDocumentsAmount);
			})
		);

		if (collections === undefined || collections.includes('media-sources')) {
			const mediaSourcesCount: number = await this.mediaSourcesSeedDataService.import();
			seededCollectionsWithAmount.set(
				'media-sources',
				mediaSourcesCount + (seededCollectionsWithAmount.get('media-sources') ?? 0)
			);
		}

		if (collections === undefined || collections.includes('systems')) {
			const systemsCount: number = await this.systemsSeedDataService.import();
			seededCollectionsWithAmount.set('systems', systemsCount + (seededCollectionsWithAmount.get('systems') ?? 0));
		}

		if (collections === undefined || collections.includes('external-tools')) {
			const externalToolsCount: number = await this.externalToolsSeedDataService.import();
			seededCollectionsWithAmount.set(
				'external-tools',
				externalToolsCount + (seededCollectionsWithAmount.get('external-tools') ?? 0)
			);
		}

		if (collections === undefined || collections.includes('instances')) {
			const instancesCount: number = await this.instancesSeedDataService.import();
			seededCollectionsWithAmount.set(
				'instances',
				instancesCount + (seededCollectionsWithAmount.get('instances') ?? 0)
			);
		}

		const seededCollectionsWithAmountFormatted: string[] = Array.from(seededCollectionsWithAmount).map(
			([key, value]) => `${key}:${value}`
		);

		return seededCollectionsWithAmountFormatted;
	}

	/**
	 * Exports all or defined <collections> from database as bson to filesystem.
	 * The behaviour should match $ mongoexport
	 * @param collections optional filter applied on existing collections
	 * @param toSeedFolder optional override existing seed data files
	 * @returns the list of collection names exported
	 */
	public async exportCollectionsToFileSystem(collections?: string[], toSeedFolder?: boolean): Promise<string[]> {
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
	public async syncIndexes(): Promise<void> {
		await this.createGroupUniqueIndex();
		await this.createExternalToolMediumUniqueIndex();
		return this.databaseManagementService.syncIndexes();
	}

	private async createGroupUniqueIndex(): Promise<void> {
		const indexName = 'groupExternalSourceUniqueIndex';
		const collection = this.databaseManagementService.getDatabaseCollection('groups');
		const indexExists: boolean = await collection.indexExists(indexName);

		if (indexExists) {
			this.logger.debug(`${indexName} does not require update`);
			return;
		}

		await collection.createIndex(
			{
				'externalSource.externalId': 1,
				'externalSource.system': 1,
			},
			{
				name: indexName,
				unique: true,
				partialFilterExpression: { externalSource: { $exists: true } },
			}
		);
	}
	private async createExternalToolMediumUniqueIndex(): Promise<void> {
		const indexName = 'externalToolMediumUniqueIndex';
		const collection = this.databaseManagementService.getDatabaseCollection('external-tools');
		const indexExists: boolean = await collection.indexExists(indexName);

		if (indexExists) {
			this.logger.debug(`${indexName} does not require update`);
			return;
		}

		await collection.createIndex(
			{
				'medium.mediumId': 1,
				'medium.mediaSourceId': 1,
			},
			{
				name: indexName,
				unique: true,
				partialFilterExpression: { medium: { $exists: true } },
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

	private resolvePlaceholder(placeholder: string): string {
		switch (placeholder) {
			case 'OIDCMOCK__BASE_URL':
				return this.config.oidcMockBaseUrl;
			case 'OIDCMOCK__CLIENT_ID':
				return this.config.oidcMockClientId;
			case 'OIDCMOCK__CLIENT_SECRET':
				return this.config.oidcMockClientSecret;
			default:
				this.logger.warn(`Placeholder "${placeholder}" could not be resolved!`);
				return '';
		}
	}

	private encryptSecrets(collectionName: string, jsonDocuments: unknown[]): void {
		if (collectionName === systemsCollectionName) {
			this.encryptSecretsInSystems(jsonDocuments as SystemEntity[]);
		}
	}

	private encryptSecretsInSystems(systems: SystemEntity[]): SystemEntity[] {
		systems.forEach((system) => {
			if (system.oauthConfig?.clientSecret) {
				system.oauthConfig.clientSecret = this.defaultEncryptionService.encrypt(system.oauthConfig.clientSecret);
			}
			if (system.oidcConfig?.clientSecret) {
				system.oidcConfig.clientSecret = this.defaultEncryptionService.encrypt(system.oidcConfig.clientSecret);
			}
		});
		return systems;
	}

	/**
	 * Removes all known secrets (hard coded) from the export.
	 * Manual replacement with the intent placeholders or value is mandatory.
	 * Currently, this affects system and storageproviders collections.
	 */
	private removeSecrets(collectionName: string, jsonDocuments: unknown[]): void {
		if (collectionName === systemsCollectionName) {
			this.removeSecretsFromSystems(jsonDocuments as SystemEntity[]);
		}
		if (collectionName === storageprovidersCollectionName) {
			this.removeSecretsFromStorageproviders(jsonDocuments as StorageProviderEntity[]);
		}
	}

	private removeSecretsFromStorageproviders(storageProviders: StorageProviderEntity[]): void {
		storageProviders.forEach((storageProvider) => {
			storageProvider.accessKeyId = defaultSecretReplacementHintText;
			storageProvider.secretAccessKey = defaultSecretReplacementHintText;
		});
	}

	private removeSecretsFromSystems(systems: SystemEntity[]): SystemEntity[] {
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

	public async migrationCreate(): Promise<void> {
		await this.databaseManagementService.migrationCreate();
	}

	public async migrationUp(from?: string, to?: string, only?: string): Promise<void> {
		await this.databaseManagementService.migrationUp(from, to, only);
	}

	public async migrationDown(from?: string, to?: string, only?: string): Promise<void> {
		await this.databaseManagementService.migrationDown(from, to, only);
	}

	public async migrationPending(): Promise<UmzugMigration[]> {
		const result = await this.databaseManagementService.migrationPending();

		return result;
	}

	public encryptPlainText(plainText: string, key: string): string {
		const encrypted = AesEncryptionHelper.encrypt(plainText, key);

		return encrypted;
	}
}
