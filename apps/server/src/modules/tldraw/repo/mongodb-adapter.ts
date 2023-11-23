import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { EntityManager } from '@mikro-orm/mongodb';
import { Sort } from 'mongodb';
import { TldrawDrawing } from '@modules/tldraw/entities';

export class MongodbAdapter {
	private collectionName: string;

	constructor(readonly configService: ConfigService<TldrawConfig, true>, private readonly _em: EntityManager) {
		this.collectionName = this.configService.get<string>('TLDRAW_DB_COLLECTION_NAME') ?? 'drawings';
	}

	get(query: object): Promise<TldrawDrawing | null> {
		const collection = this.getCollection();
		return collection.findOne<TldrawDrawing>(query, { allowDiskUse: true });
	}

	async put(query: object, values: object) {
		const collection = this.getCollection();
		await collection.updateOne(query, { $set: values }, { upsert: true });
	}

	async del(query: object) {
		const collection = this.getCollection();
		await collection.deleteMany(query);
	}

	readAsCursor(query: object, opts: object = {}) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { limit = 0, reverse = false } = opts;

		const collection = this.getCollection();
		const sortQuery: Sort = reverse ? { clock: -1, part: 1 } : { clock: 1, part: 1 };
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const curs = collection.find<TldrawDrawing>(query, { allowDiskUse: true }).sort(sortQuery).limit(limit);

		return curs.toArray();
	}

	private getCollection() {
		return this._em.getCollection(this.collectionName);
	}
}
