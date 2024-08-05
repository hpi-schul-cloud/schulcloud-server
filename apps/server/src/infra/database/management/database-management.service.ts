import { MikroORM } from '@mikro-orm/core';
import { MigrateOptions, UmzugMigration } from '@mikro-orm/migrations-mongodb';
import { EntityManager } from '@mikro-orm/mongodb';
import { Collection, Db } from '@mikro-orm/mongodb/node_modules/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseEntity } from '@shared/domain/entity';

@Injectable()
export class DatabaseManagementService {
	constructor(private em: EntityManager, private readonly orm: MikroORM) {}

	private get db(): Db {
		const connection = this.em.getConnection('write').getDb();
		return connection;
	}

	getDatabaseCollection(collectionName: string): Collection {
		const collection = this.db.collection(collectionName);
		return collection;
	}

	async importCollection(collectionName: string, jsonDocuments: unknown[]): Promise<number> {
		if (jsonDocuments.length === 0) {
			return 0;
		}
		const collection = this.getDatabaseCollection(collectionName);
		const { insertedCount } = await collection.insertMany(jsonDocuments as BaseEntity[], {
			forceServerObjectId: true,
			// bypassDocumentValidation: true,
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

	async syncIndexes(): Promise<void> {
		return this.orm.getSchemaGenerator().ensureIndexes();
	}

	async migrationUp(from?: string, to?: string, only?: string): Promise<void> {
		const migrator = this.orm.getMigrator();
		const params = this.migrationParams(only, from, to);
		await migrator.up(params);
	}

	async migrationDown(from?: string, to?: string, only?: string): Promise<void> {
		const migrator = this.orm.getMigrator();
		const params = this.migrationParams(only, from, to);

		await migrator.down(params);
	}

	async migrationPending(): Promise<UmzugMigration[]> {
		const migrator = this.orm.getMigrator();
		const pendingMigrations = await migrator.getPendingMigrations();
		return pendingMigrations;
	}

	private migrationParams(only?: string, from?: string, to?: string) {
		const params: MigrateOptions = {};
		if (only) {
			params.migrations = [only];
		} else {
			if (from) {
				params.from = from;
			}
			if (to) {
				params.to = to;
			}
		}
		return params;
	}
}
