import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Collection, Db } from 'mongodb';

@Injectable()
export class DatabaseManagementService {
	constructor(private em: EntityManager) {}

	private get db(): Db {
		return this.em.getConnection('write').getDb();
	}

	private getDatabaseCollection(collectionName: string): Collection {
		const collection = this.db.collection(collectionName);
		return collection;
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

	async clearCollection(collectionName: string): Promise<number> {
		const collection = this.getDatabaseCollection(collectionName);
		const { deletedCount } = await collection.deleteMany({});
		return deletedCount || 0;
	}

	async getCollectionNames(): Promise<string[]> {
		const collections = (await this.db.listCollections(undefined, { nameOnly: true }).toArray()) as unknown[] as {
			name: string;
		}[];
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

	async dropCollection(collectionName: string): Promise<void> {
		await this.db.dropCollection(collectionName);
	}
}
