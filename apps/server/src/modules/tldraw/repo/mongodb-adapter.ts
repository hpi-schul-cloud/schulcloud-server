import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { EntityManager } from '@mikro-orm/mongodb';
import { Sort } from 'mongodb';
import { TldrawDrawing } from '@modules/tldraw/entities';
import { MikroORM } from '@mikro-orm/core';

export class MongodbAdapter {
	private collectionName: string;

	constructor(
		readonly configService: ConfigService<TldrawConfig, true>,
		private readonly em: EntityManager,
		private readonly orm: MikroORM
	) {
		this.collectionName = this.configService.get<string>('TLDRAW_DB_COLLECTION_NAME') ?? 'drawings';
	}

	/**
	 * Apply a $query and get one document from MongoDB.
	 * @param {object} query
	 * @returns {Promise<TldrawDrawing | null>}
	 */
	get(query: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		return collection.findOne<TldrawDrawing>(query, { allowDiskUse: true });
	}

	/**
	 * Store one document in MongoDB.
	 * @param {object} query
	 * @param {object} values
	 * @returns {Promise<object>} Stored document
	 */
	async put(query: object, values: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		await collection.updateOne(query, { $set: values }, { upsert: true });
		return this.get(query);
	}

	/**
	 * Removes all documents that fit the $query
	 * @param {object} query
	 * @returns {Promise<object>} Contains status of the operation
	 */
	del(query: object): Promise<object> {
		const collection = this.getCollection();
		const bulk = collection.initializeOrderedBulkOp();
		bulk.find(query).delete();
		return bulk.execute();
	}

	/**
	 * Get all or at least $opts.limit documents that fit the $query.
	 * @param {object} query
	 * @param {object} [opts]
	 * @param {number} [opts.limit]
	 * @param {boolean} [opts.reverse]
	 * @returns {Promise<Array<object>>}
	 */
	readAsCursor(query: object, opts: object = {}): Promise<TldrawDrawing[]> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { limit = 0, reverse = false } = opts;

		const collection = this.getCollection();
		const sortQuery: Sort = reverse ? { clock: -1, part: 1 } : { clock: 1, part: 1 };
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const curs = collection.find<TldrawDrawing>(query, { allowDiskUse: true }).sort(sortQuery).limit(limit);

		return curs.toArray();
	}

	/**
	 * Close connection to MongoDB instance.
	 */
	async close() {
		await this.orm.close();
	}

	/**
	 * Delete database
	 */
	async flush() {
		await this.getCollection().drop();
		await this.close();
	}

	getCollection() {
		return this.em.getCollection(this.collectionName);
	}

	async syncIndexes(): Promise<void> {
		return this.orm.getSchemaGenerator().ensureIndexes();
	}
}
