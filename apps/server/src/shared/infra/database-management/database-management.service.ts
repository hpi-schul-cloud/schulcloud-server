import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';

@Injectable()
export class DatabaseManagementService {
	private db: Db;

	constructor(private em: EntityManager) {
		const driver = this.em.getDriver();
		this.db = driver.getConnection('write').getDb();
	}

	async importCollection(collectionName: string, jsonDocuments: unknown[]): Promise<number> {
		const collection = this.getCollection(collectionName);
		if (jsonDocuments.length === 0) {
			return 0;
		}
		const { insertedCount } = await collection.insertMany(jsonDocuments, {
			forceServerObjectId: true,
			bypassDocumentValidation: true,
		});
		return insertedCount;
	}

	async getDocumentsOfCollectionAsJson(collectionName: string): Promise<unknown[]> {
		const collection = this.getCollection(collectionName);
		const documents = (await collection.find({}).toArray()) as unknown[];
		return documents;
	}

	async dropCollectionIfExists(collectionName: string): Promise<void> {
		const collectionExists = await this.collectionExists(collectionName);
		if (collectionExists) {
			// drop collection if exists
			await this.db.dropCollection(collectionName);
		}
	}

	getCollection(collectionName: string): Collection {
		const collection = this.db.collection(collectionName);
		return collection;
	}

	async getCollections(): Promise<string[]> {
		const collections = (await this.db.listCollections().toArray()) as unknown[] as { name: string }[];
		const collectionNames = collections.map((collection) => collection.name);
		return collectionNames;
	}

	async collectionExists(collectionName: string): Promise<boolean> {
		const collections = await this.getCollections();
		const result = collections.includes(collectionName);
		return result;
	}

	async createCollection(collectionName: string): Promise<void> {
		await this.db.createCollection(collectionName);
	}
}
