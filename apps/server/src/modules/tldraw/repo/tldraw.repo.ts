import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { TldrawDrawing } from '@src/modules/tldraw/entities';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { Sort } from 'mongodb';

@Injectable()
export class TldrawRepo {
	private collectionName: string;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly _em: EntityManager,
		private readonly orm: MikroORM
	) {
		this.collectionName = this.configService.get<string>('TLDRAW_DB_COLLECTION_NAME') ?? 'drawings';
	}

	async create(entity: TldrawDrawing): Promise<void> {
		await this._em.persistAndFlush(entity);
	}

	async findByDrawingName(drawingName: string): Promise<TldrawDrawing[]> {
		return this._em.find(TldrawDrawing, { docName: drawingName });
	}

	async delete(entity: TldrawDrawing | TldrawDrawing[]): Promise<void> {
		await this._em.removeAndFlush(entity);
	}

	get(query: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		return collection.findOne<TldrawDrawing>(query, { allowDiskUse: true });
	}

	async put(query: object, values: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		await collection.updateOne(query, { $set: values }, { upsert: true });
		return this.get(query);
	}

	del(query: object): Promise<object> {
		const collection = this.getCollection();
		const bulk = collection.initializeOrderedBulkOp();
		bulk.find(query).delete();
		return bulk.execute();
	}

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
		return this._em.getCollection(this.collectionName);
	}

	async syncIndexes(): Promise<void> {
		return this.orm.getSchemaGenerator().ensureIndexes();
	}
}
