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
import { EntityManager } from '@mikro-orm/mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as BSON from 'bson';
import { orderBy } from 'lodash';
import { EOL } from 'os';
import { Db } from 'mongodb';
import { Logger } from '../../../core/logger/logger.service';

export interface ICollectionFile {
	filePath: string;
	collectionName: string;
}
@Injectable()
export class DatabaseManagementService {
	private logger: Logger;

	private db: Db;

	/**
	 * relative path to seed data folder based of location of this file.
	 */
	private basePath = '../../../../../../backup/setup';

	/**
	 * absolute path reference for seed data folder.
	 */
	private folder: string;

	constructor(private em: EntityManager) {
		const driver = this.em.getDriver();
		this.db = driver.getConnection('write').getDb();
		this.folder = path.join(__dirname, this.basePath);
		this.logger = new Logger(DatabaseManagementService.name, true);
	}

	async importCollection(collectionName: string, bsonDocuments: Record<string, unknown>[]): Promise<number> {
		this.logger.log(`import documents into collection ${collectionName}...`);
		const collection = this.getCollection(collectionName);
		await this.db.dropCollection(collectionName);
		this.logger.log(` - dropped collection ${collectionName} successfully`);
		await this.db.createCollection(collectionName);

		const jsonDocuments = BSON.EJSON.deserialize(bsonDocuments) as any[];
		const { insertedCount } = await collection.insertMany(jsonDocuments, {
			forceServerObjectId: true,
			bypassDocumentValidation: true,
		});
		this.logger.log(` - imported ${insertedCount} documents into collection ${collectionName} successfully`);
		return insertedCount;
	}

	private getCollection(collectionName: string) {
		const collection = this.db.collection(collectionName);
		return collection;
	}

	private async getCollections(): Promise<string[]> {
		const collections = await this.db.listCollections().toArray();
		const collectionNames = collections.map((collection) => collection.name);
		return collectionNames;
	}

	private loadBjsonFromFile(filePath: string) {
		const file = fs.readFileSync(filePath, 'utf-8'); // TODO no encoding, no json step?
		const bsonDocuments = JSON.parse(file) as Record<string, unknown>[];
		return bsonDocuments;
	}

	private loadAllCollectionsFromFilesystem(): ICollectionFile[] {
		const filenames = fs.readdirSync(this.folder);
		const files = filenames.map((fileName) => ({
			filePath: path.join(this.folder, fileName),
			collectionName: fileName.split('.')[0],
		}));
		return files;
	}

	private async loadAllCollectionsFromDatabase(): Promise<ICollectionFile[]> {
		const collections = await this.getCollections();
		const files = collections.map((collectionName) => ({
			filePath: path.join(this.folder, `${collectionName}.json`),
			collectionName,
		}));
		return files;
	}

	private async getDocumentsOfCollection(collectionName: string): Promise<any[]> {
		const collection = this.getCollection(collectionName);
		const documents = await collection.find({}).toArray();
		const bsonDocuments = BSON.EJSON.serialize(documents) as any[];
		return bsonDocuments;
	}

	private writeTextToFile(text: string, filePath: string) {
		fs.writeFileSync(filePath, text + EOL);
	}

	private async loadCollections(collectionFilter: string[] | undefined, source: 'files' | 'database') {
		let files: ICollectionFile[];

		switch (source) {
			case 'files':
				files = this.loadAllCollectionsFromFilesystem();
				break;
			case 'database':
				files = await this.loadAllCollectionsFromDatabase();
				break;
			default:
				throw new Error(`invalid source ${JSON.stringify(source)}, use files or database instead`);
		}

		if (Array.isArray(collectionFilter) && collectionFilter.length > 0) {
			files = files.filter(({ collectionName }) => collectionFilter?.includes(collectionName));

			if (files.length === 0) {
				throw new Error(
					`At least one collectionName of ${JSON.stringify(
						collectionFilter
					)} is invalid. Collection names available are: ${JSON.stringify(
						this.loadAllCollectionsFromFilesystem().map((file) => file.collectionName)
					)}`
				);
			}
			this.logger.log(`collections found: ${JSON.stringify(files.map((file) => file.collectionName))}`);
		}
		return files;
	}

	async seed(collections?: string[]): Promise<string[]> {
		const files = await this.loadCollections(collections, 'files');
		for (const { filePath, collectionName } of files) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const bsonDocuments = this.loadBjsonFromFile(filePath);
			await this.importCollection(collectionName, bsonDocuments);
		}
		return files.map((i) => i.collectionName);
	}

	async export(collections?: string[]): Promise<string[]> {
		const files = await this.loadCollections(collections, 'database');
		for (const { filePath, collectionName } of files) {
			const documents = await this.getDocumentsOfCollection(collectionName);
			this.logger.log(`found ${documents.length} documents in collection ${collectionName}...`);
			const sortedDocuments = orderBy(documents, ['_id.$oid', 'createdAt.$date'], ['asc', 'asc']);
			const text = JSON.stringify(sortedDocuments, undefined, '	');
			this.writeTextToFile(text, filePath);
			this.logger.log(` - text data written to file ${filePath}`);
		}
		return files.map((i) => i.collectionName);
	}
}
