/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-extend-native */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-syntax */
import { Injectable } from '@nestjs/common';
import { orderBy } from 'lodash';
import { FileSystemAdapter } from '../file-system/file-system.adapter';
import { DatabaseManagementService } from './database-management.service';
import { BsonConverter } from './converter/bson.converter';

export interface ICollectionFilePath {
	filePath: string;
	collectionName: string;
}

@Injectable()
export class DatabaseManagementUc {
	/**
	 * relative path to seed data folder based of location of this file.
	 */
	private basePath = '../../../../../../backup/setup';

	/**
	 * absolute path reference for seed data folder.
	 */
	private get seedDataFolderPath(): string {
		const folderPath = this.fileSystemAdapter.joinPath(__dirname, this.basePath);
		return folderPath;
	}

	constructor(
		private fileSystemAdapter: FileSystemAdapter,
		private databaseManagementService: DatabaseManagementService,
		private bsonConverter: BsonConverter
	) {}

	/**
	 * Loads all collection names from database and adds related file paths.
	 * @returns {ICollectionFilePath}
	 */
	private async loadAllCollectionsFromDatabase(): Promise<ICollectionFilePath[]> {
		const collections = await this.databaseManagementService.getCollectionNames();
		const collectionsWithFilePaths = collections.map((collectionName) => ({
			filePath: this.fileSystemAdapter.joinPath(this.seedDataFolderPath, `${collectionName}.json`),
			collectionName,
		}));
		return collectionsWithFilePaths;
	}

	/**
	 * Loads all collection names and file paths from backup files.
	 * @returns {ICollectionFilePath}
	 */
	private loadAllCollectionsFromFilesystem(): ICollectionFilePath[] {
		const filenames = this.fileSystemAdapter.readDirSync(this.seedDataFolderPath);
		const collectionsWithFilePaths = filenames.map((fileName) => ({
			filePath: this.fileSystemAdapter.joinPath(this.seedDataFolderPath, fileName),
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
		collectionNameFilter?: string[]
	) {
		let allCollectionsWithFilePaths: ICollectionFilePath[];

		// load all available collections from source
		switch (source) {
			case 'files':
				allCollectionsWithFilePaths = this.loadAllCollectionsFromFilesystem();
				break;
			case 'database':
				allCollectionsWithFilePaths = await this.loadAllCollectionsFromDatabase();
				break;
			default:
				throw new Error(`invalid source ${JSON.stringify(source)}, use 'files' or 'database' instead`);
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
					)} is invalid. Collection names available are: ${JSON.stringify(
						this.loadAllCollectionsFromFilesystem().map((file) => file.collectionName)
					)}`
				);
			}

			return filteredCollectionsWithFilePaths;
		}

		return allCollectionsWithFilePaths;
	}

	/**
	 * Imports all or filtered <collections> from filesystem as bson to database.
	 * @param collections optional filter applied on existing collections
	 * @returns the list of collection names exported
	 */
	async seedDatabaseCollectionsFromFileSystem(collections?: string[]): Promise<string[]> {
		// detect collections to seed based on filesystem data
		const collectionsToSeed = await this.loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
			'files',
			collections
		);
		const seededCollectionsWithAmount: string[] = [];

		for (const { filePath, collectionName } of collectionsToSeed) {
			// load text from backup file
			const text = this.fileSystemAdapter.readFileSync(filePath);
			// create bson-objects from text
			const bsonDocuments = JSON.parse(text) as unknown[];
			// deserialize bson (format of mongoexport) to json documents we can import to mongo
			const jsonDocuments = this.bsonConverter.deserialize(bsonDocuments);
			// drop existing collection if exists
			await this.databaseManagementService.dropCollectionIfExists(collectionName);
			// create collection again
			await this.databaseManagementService.createCollection(collectionName);
			// import backuop data into database collection
			const importedDocumentsAmount = await this.databaseManagementService.importCollection(
				collectionName,
				jsonDocuments
			);
			// keep collection name and number of imported documents
			seededCollectionsWithAmount.push(`${collectionName}:${importedDocumentsAmount}`);
		}
		return seededCollectionsWithAmount;
	}

	/**
	 * Exports all or defined <collections> from database as bson to filesystem.
	 * @param collections optional filter applied on existing collections
	 * @returns the list of collection names exported
	 */
	async exportCollectionsToFileSystem(collections?: string[]): Promise<string[]> {
		// detect collections to export based on database collections
		const collectionsToExport = await this.loadCollectionsAvailableFromSourceAndFilterByCollectionNames(
			'database',
			collections
		);
		const exportedCollections: string[] = [];

		for (const { filePath, collectionName } of collectionsToExport) {
			// load json documents from collection
			const jsonDocuments = await this.databaseManagementService.findDocumentsOfCollection(collectionName);
			// serialize to bson (format of mongoexport)
			const bsonDocuments = this.bsonConverter.deserialize(jsonDocuments);
			// sort results to have 'new' data added at documents end
			const sortedBsonDocuments = orderBy(bsonDocuments, ['_id.$oid', 'createdAt.$date'], ['asc', 'asc']);
			// convert to text
			const TAB = '	';
			const text = JSON.stringify(sortedBsonDocuments, undefined, TAB);
			// persist to filesystem
			this.fileSystemAdapter.writeFileSync(filePath, text + this.fileSystemAdapter.EOL);
			// keep collection name and number of exported documents
			exportedCollections.push(`${collectionName}:${sortedBsonDocuments.length}`);
		}
		return exportedCollections;
	}
}
