/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-restricted-syntax */
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../../core/logger/logger.service';

const basePath = '../../../../../../backup/setup';

interface ICollection {
	name: string;
}

@Injectable()
export class ManagementService {
	private logger: Logger;

	constructor(private em: EntityManager) {
		this.logger = new Logger(ManagementService.name, true);
	}

	/**
	 * Drops all collections of the mongo drivers database connection.
	 * Hint: The originated MongoDriver.dropCollections() would only remove collections of registered entities.
	 */
	async dropAllCollections(): Promise<string[]> {
		const driver = this.em.getDriver();
		const db = driver.getConnection('write').getDb();
		const collections = ((await db.listCollections().toArray()) || []) as ICollection[];
		const collectionNames = collections.map((collection) => collection.name);
		for (const collection of collectionNames) {
			this.logger.log(`drop collection: ${collection}`);
			// eslint-disable-next-line no-await-in-loop
			await db.dropCollection(collection);
			this.logger.log(`collection dropped: ${collection}`);
		}
		return collectionNames;
	}

	async importCollection(
		collectionName: string,
		dropCollection: boolean,
		documents: Record<string, unknown>[]
	): Promise<void> {
		this.logger.log(`import documents into collection ${collectionName}...`);
		const driver = this.em.getDriver();
		const db = driver.getConnection('write').getDb();
		if (dropCollection) {
			await db.dropCollection(collectionName);
			this.logger.log(`dropped collection ${collectionName} successfully`);
			await db.createCollection(collectionName);
		}
		const collection = db.collection(collectionName);
		const { insertedCount } = await collection.insertMany(documents, {
			forceServerObjectId: true,
			bypassDocumentValidation: true,
		});
		this.logger.log(`imported ${insertedCount} documents into collection ${collectionName} successfully`);
	}

	async resetAllCollections(): Promise<string[]> {
		const folder = path.join(__dirname, basePath);
		const files = fs.readdirSync(folder);
		const backupData = files.map((collectionFile) => {
			const filePath = path.join(folder, collectionFile);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const collectionName = collectionFile.split('.')[0];
			const file = fs.readFileSync(filePath, 'utf-8');
			const documents = JSON.parse(file) as Record<string, any>[];
			return { documents, collection: collectionName };
		});
		for (const { collection, documents } of backupData) {
			if (documents) {
				await this.importCollection(collection, true, documents);
			}
		}
		return files;
	}
}
