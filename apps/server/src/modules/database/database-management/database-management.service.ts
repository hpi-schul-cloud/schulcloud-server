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

const basePath = '../../../../../../backup/setup';

@Injectable()
export class ManagementService {
	private logger: Logger;

	constructor(private em: EntityManager) {
		this.logger = new Logger(ManagementService.name, true);
	}

	async importCollection(
		collectionName: string,
		dropCollection: boolean,
		documents: Record<string, unknown>[]
	): Promise<void> {
		this.logger.log(`import documents into collection ${collectionName}...`);
		const { db, collection } = this.getCollection(collectionName);
		if (dropCollection) {
			await db.dropCollection(collectionName);
			this.logger.log(`dropped collection ${collectionName} successfully`);
			await db.createCollection(collectionName);
		}
		const jsonDocuments = BSON.EJSON.deserialize(documents) as any[];
		const { insertedCount } = await collection.insertMany(jsonDocuments, {
			forceServerObjectId: true,
			bypassDocumentValidation: true,
		});
		this.logger.log(`imported ${insertedCount} documents into collection ${collectionName} successfully`);
	}

	private getCollection(collectionName: string) {
		// TODO constructor
		const driver = this.em.getDriver();
		const db = driver.getConnection('write').getDb();
		const collection = db.collection(collectionName);
		return { db, collection };
	}

	async resetAllCollections(): Promise<void> {
		const files = this.getCollectionFiles();
		for (const { filePath, collectionName } of files) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const bsonDocuments = this.loadBsonFromFile(filePath);
			await this.importCollection(collectionName, true, bsonDocuments);
		}
	}

	private loadBsonFromFile(filePath: string) {
		const file = fs.readFileSync(filePath, 'utf-8'); // TODO no encoding, no json step?
		const bsonDocuments = JSON.parse(file) as Record<string, unknown>[];
		return bsonDocuments;
	}

	private getCollectionFiles() {
		const folder = path.join(__dirname, basePath);
		const filenames = fs.readdirSync(folder);
		const files = filenames.map((fileName) => ({
			filePath: path.join(folder, fileName),
			collectionName: fileName.split('.')[0],
		}));
		return files;
	}

	async exportCollection(name: string): Promise<any[]> {
		const { collection } = this.getCollection(name);
		const documents = await collection.find({}).toArray();
		this.logger.log(`found ${documents.length} documents in collection ${name}`);
		const bsonDocuments = BSON.EJSON.serialize(documents) as any[];
		return bsonDocuments;
	}

	async exportAllCollections(): Promise<void> {
		const files = this.getCollectionFiles();
		for (const { filePath, collectionName } of files) {
			const documents = await this.exportCollection(collectionName);
			const sortedDocuments = orderBy(documents, ['_id.$oid', 'createdAt.$date', 'name'], ['asc', 'asc', 'asc']);
			const text = JSON.stringify(sortedDocuments, undefined, '	');
			this.writeDocumentsToFile(text, filePath);
		}
	}

	private writeDocumentsToFile(text: string, filePath: string) {
		fs.writeFileSync(filePath, text + EOL);
		this.logger.log(`write documents in ${filePath}`);
	}
}
