import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';

@Injectable()
export class DatabaseManagementService {
	constructor(private em: EntityManager) {}

	private get db(): Db {
		const db = this.em.getConnection('write').getDb();
		return db;
	}

	async importCollection(collectionName: string, jsonDocuments: unknown[]): Promise<number> {
		const collection = this.getDatabaseCollection(collectionName);
		if (jsonDocuments.length === 0) {
			return 0;
		}
		const { insertedCount } = await collection.insertMany(jsonDocuments, {
			forceServerObjectId: true,
			bypassDocumentValidation: true,
		});
		return insertedCount;
	}

	async findDocumentsOfCollection(collectionName: string): Promise<unknown[]> {
		const collection = this.getDatabaseCollection(collectionName);
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

	getDatabaseCollection(collectionName: string): Collection {
		const collection = this.db.collection(collectionName);
		return collection;
	}

	async getCollectionNames(): Promise<string[]> {
		const collections = (await this.db.listCollections().toArray()) as unknown[] as { name: string }[];
		const collectionNames = collections.map((collection) => collection.name);
		return collectionNames;
	}

	async collectionExists(collectionName: string): Promise<boolean> {
		const collections = await this.getCollectionNames();
		const result = collections.includes(collectionName);
		return result;
	}

	async createCollection(collectionName: string): Promise<void> {
		await this.db.createCollection(collectionName);
	}
}
