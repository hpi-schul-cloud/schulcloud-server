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
import { Logger } from '../../../core/logger/logger.service';

@Injectable()
export class DatabaseManagementService {
	private logger: Logger;

	private basePath = '../../../../../../backup/setup';

	constructor(private em: EntityManager) {
		this.logger = new Logger(DatabaseManagementService.name, true);
	}

	async importCollection(
		collectionName: string,
		dropCollection: boolean,
		bsonDocuments: Record<string, unknown>[]
	): Promise<number> {
		this.logger.log(`import documents into collection ${collectionName}...`);
		const { db, collection } = this.getCollection(collectionName);
		if (dropCollection) {
			await db.dropCollection(collectionName);
			this.logger.log(` - dropped collection ${collectionName} successfully`);
			await db.createCollection(collectionName);
		}
		const jsonDocuments = BSON.EJSON.deserialize(bsonDocuments) as any[];
		const { insertedCount } = await collection.insertMany(jsonDocuments, {
			forceServerObjectId: true,
			bypassDocumentValidation: true,
		});
		this.logger.log(` - imported ${insertedCount} documents into collection ${collectionName} successfully`);
		return insertedCount;
	}

	private getCollection(collectionName: string) {
		const driver = this.em.getDriver();
		const db = driver.getConnection('write').getDb();
		const collection = db.collection(collectionName);
		return { db, collection };
	}

	private loadBjsonFromFile(filePath: string) {
		const file = fs.readFileSync(filePath, 'utf-8'); // TODO no encoding, no json step?
		const bsonDocuments = JSON.parse(file) as Record<string, unknown>[];
		return bsonDocuments;
	}

	private loadCollectionsFromFilesystem() {
		const folder = path.join(__dirname, this.basePath);
		const filenames = fs.readdirSync(folder);
		const files = filenames.map((fileName) => ({
			filePath: path.join(folder, fileName),
			collectionName: fileName.split('.')[0],
		}));
		return files;
	}

	private async getDocumentsOfCollection(collectionName: string): Promise<any[]> {
		const { collection } = this.getCollection(collectionName);
		const documents = await collection.find({}).toArray();
		const bsonDocuments = BSON.EJSON.serialize(documents) as any[];
		return bsonDocuments;
	}

	private writeTextToFile(text: string, filePath: string) {
		fs.writeFileSync(filePath, text + EOL);
	}

	async import(collections?: string[]): Promise<void> {
		const files = this.loadFilesAndFilterByCollectionName(collections);
		for (const { filePath, collectionName } of files) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const bsonDocuments = this.loadBjsonFromFile(filePath);
			await this.importCollection(collectionName, true, bsonDocuments);
		}
	}

	async export(collections?: string[]): Promise<void> {
		const files = this.loadFilesAndFilterByCollectionName(collections);
		for (const { filePath, collectionName } of files) {
			const documents = await this.getDocumentsOfCollection(collectionName);
			this.logger.log(`found ${documents.length} documents in collection ${collectionName}...`);
			const sortedDocuments = orderBy(documents, ['_id.$oid', 'createdAt.$date'], ['asc', 'asc']);
			const text = JSON.stringify(sortedDocuments, undefined, '	');
			this.writeTextToFile(text, filePath);
			this.logger.log(` - text data written to file ${filePath}`);
		}
	}

	private loadFilesAndFilterByCollectionName(collections: string[] | undefined) {
		let files = this.loadCollectionsFromFilesystem();

		if (collections?.length !== 0) {
			files = files.filter(({ collectionName }) => collections?.includes(collectionName));

			if (files.length === 0) {
				throw new Error(
					`collectionName invalid. collection names available to be used: ${JSON.stringify(
						this.loadCollectionsFromFilesystem().map((file) => file.collectionName)
					)}`
				);
			}
			this.logger.log(`collections found: ${JSON.stringify(files.map((file) => file.collectionName))}`);
		}
		return files;
	}
}
