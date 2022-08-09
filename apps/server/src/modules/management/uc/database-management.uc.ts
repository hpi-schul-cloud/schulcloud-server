/* eslint-disable no-await-in-loop */

import { Inject, Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';
import { FileSystemAdapter } from '@shared/infra/file-system';
import { DatabaseManagementService } from '@shared/infra/database';
import { ConfigService } from '@nestjs/config';
import { DefaultEncryptionService, IEncryptionService, LdapEncryptionService } from '@shared/infra/encryption';
import { System } from '@shared/domain';
import { SysType } from '@shared/infra/identity-management';
import { BsonConverter } from '../converter/bson.converter';

export interface ICollectionFilePath {
	filePath: string;
	collectionName: string;
}

const systemsCollectionName = 'systems';
const storageprovidersCollectionName = 'storageproviders';

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
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: IEncryptionService,
		@Inject(LdapEncryptionService) private readonly ldapEncryptionService: IEncryptionService
	) {}

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

				if (collectionName === systemsCollectionName) {
					this.encryptSecretsInSystems(jsonDocuments as System[]);
				}

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
				if (collectionName === systemsCollectionName) {
					this.removeSecretsFromSystems(jsonDocuments as System[]);
				}
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
		let start = 0;
		while (start >= 0) {
			start = json.indexOf('${', start);
			if (start > 0) {
				// skip escaped indicator
				if (json.charAt(start - 1) === '\\') {
					start += 2;
				} else {
					const end = json.indexOf('}', start);
					const placeholder = json.slice(start + 2, end).trim();
					const placeholderContent = this.configService.get<string>(placeholder) ?? '';
					json = json.slice(0, start) + placeholderContent + json.slice(end + 1);
					start += placeholderContent.length + 1;
				}
			}
		}
		return json;
	}

	private encryptSecretsInSystems(systems: System[]) {
		systems.forEach((system) => {
			if (system.oauthConfig) {
				system.oauthConfig.clientSecret = this.defaultEncryptionService.encrypt(system.oauthConfig.clientSecret);
				system.oauthConfig.clientId = this.defaultEncryptionService.encrypt(system.oauthConfig.clientId);
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

	private removeSecretsFromSystems(systems: System[]) {
		systems.forEach((system) => {
			// The system's alias needs to be set otherwise the export will fail here, but that is acceptable.
			if (system.oauthConfig) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				system.oauthConfig.clientSecret = `\${${system.alias!.toLocaleUpperCase()}_CLIENT_SECRET}`;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				system.oauthConfig.clientId = `\${${system.alias!.toLocaleUpperCase()}_CLIENT_ID}`;
			}
			if (system.type === SysType.OIDC && system.config) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				system.config.clientSecret = `\${${system.alias!.toLocaleUpperCase()}_CLIENT_SECRET}`;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				system.config.clientId = `\${${system.alias!.toLocaleUpperCase()}_CLIENT_ID}`;
			}
		});
		return systems;
	}
}
