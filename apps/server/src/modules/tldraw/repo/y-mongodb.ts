import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongodbAdapter } from '@modules/tldraw/repo/mongodb-adapter';
import * as promise from 'lib0/promise';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import * as U from './utils';

@Injectable()
export class YMongodb {
	private flushSize: number;

	private tr = { string: Promise<any> };

	private _transact;

	private adapter: MongodbAdapter;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly em: EntityManager,
		private readonly orm: MikroORM
	) {
		this.flushSize = this.configService.get<number>('TLDRAW_DB_FLUSH_SIZE') ?? 400;
		this.adapter = new MongodbAdapter(configService, em, orm);

		this._transact = <T>(docName: string, f: (any) => Promise<T>) => {
			if (!this.tr[docName]) {
				this.tr[docName] = promise.resolve();
			}

			const currTr = this.tr[docName];
			let nextTr = null;


			nextTr = (async () => {
				await currTr;

				let res = null;
				try {
					res = await f(this.adapter);
				} catch (err) {
					// eslint-disable-next-line no-console
					console.warn('Error during saving transaction', err);
				}

				// once the last transaction for a given docName resolves, remove it from the queue
				if (this.tr[docName] === nextTr) {
					delete this.tr[docName];
				}

				return res;
			})();

			this.tr[docName] = nextTr;

			return this.tr[docName];
		};
	}

	async createIndex(): Promise<void> {
		const collection = this.adapter.getCollection();
		await collection.createIndex({
			version: 1,
			docName: 1,
			action: 1,
			clock: 1,
			part: 1,
		});
		await this.adapter.syncIndexes();
	}

	getYDoc(docName: string): Promise<Doc> {
		return this._transact(docName, async (db: MongodbAdapter): Promise<Doc> => {
			const updates = await U.getMongoUpdates(db, docName);
			const ydoc = new Doc();
			ydoc.transact(() => {
				for (let i = 0; i < updates.length; i++) {
					applyUpdate(ydoc, updates[i]);
					updates[i] = null;
				}
			});
			if (updates.length > this.flushSize) {
				await U.flushDocument(db, docName, encodeStateAsUpdate(ydoc), encodeStateVector(ydoc));
			}
			return ydoc;
		});
	}

	storeUpdate(docName: string, update: Uint8Array): Promise<number> {
		return this._transact(docName, (db: MongodbAdapter) => U.storeUpdate(db, docName, update));
	}

	flushDocument(docName: string) {
		return this._transact(docName, async (db: MongodbAdapter) => {
			const updates = await U.getMongoUpdates(db, docName);
			const { update, sv } = U.mergeUpdates(updates);
			await U.flushDocument(db, docName, update, sv);
		});
	}
}
