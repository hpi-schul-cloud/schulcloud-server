import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { BulkWriteResult, Collection, Sort } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { TldrawDrawing } from '../entities';

@Injectable()
export class TldrawRepo {
	constructor(private readonly em: EntityManager, private readonly orm: MikroORM) {}

	public async create(entity: TldrawDrawing): Promise<void> {
		await this.em.persistAndFlush(entity);
	}

	public async findByDocName(docName: string): Promise<TldrawDrawing[]> {
		const drawings = await this.em.find(TldrawDrawing, { docName });
		return drawings;
	}

	public async delete(entity: TldrawDrawing | TldrawDrawing[]): Promise<void> {
		await this.em.removeAndFlush(entity);
	}

	public get(query: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		return collection.findOne<TldrawDrawing>(query, { allowDiskUse: true });
	}

	public async put(query: object, values: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		await collection.updateOne(query, { $set: values }, { upsert: true });
		return this.get(query);
	}

	public del(query: object): Promise<BulkWriteResult> {
		const collection = this.getCollection();
		const bulk = collection.initializeOrderedBulkOp();
		bulk.find(query).delete();
		return bulk.execute();
	}

	public readAsCursor(query: object, opts: { limit?: number; reverse?: boolean } = {}): Promise<TldrawDrawing[]> {
		const { limit = 0, reverse = false } = opts;

		const collection = this.getCollection();
		const sortQuery: Sort = reverse ? { clock: -1, part: 1 } : { clock: 1, part: 1 };
		const curs = collection.find<TldrawDrawing>(query, { allowDiskUse: true }).sort(sortQuery).limit(limit);

		return curs.toArray();
	}

	public getCollection(): Collection<TldrawDrawing> {
		return this.em.getCollection(TldrawDrawing);
	}

	public async ensureIndexes(): Promise<void> {
		await this.orm.getSchemaGenerator().ensureIndexes();
	}
}
