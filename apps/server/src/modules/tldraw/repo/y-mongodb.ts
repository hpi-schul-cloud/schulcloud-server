import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import * as promise from 'lib0/promise';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Injectable } from '@nestjs/common';
import { TldrawRepo } from '@modules/tldraw/repo/tldraw.repo';
import { storeUpdate, flushDocument, getMongoUpdates, mergeUpdates } from '../utils';

@Injectable()
export class YMongodb {
	private flushSize: number;

	private tr = { string: Promise<never> };

	private _transact;

	constructor(private readonly configService: ConfigService<TldrawConfig, true>, private readonly repo: TldrawRepo) {
		this.flushSize = this.configService.get<number>('TLDRAW_DB_FLUSH_SIZE') ?? 400;

		this._transact = <T>(docName: string, f: (TldrawRepo) => Promise<T>) => {
			if (!this.tr[docName]) {
				this.tr[docName] = promise.resolve();
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const currTr = this.tr[docName];
			let nextTr = null;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			nextTr = (async () => {
				await currTr;

				let res;
				try {
					res = await f(this.repo);
				} catch (err) {
					// eslint-disable-next-line no-console
					console.warn('Error during saving transaction', err);
				}

				// once the last transaction for a given docName resolves, remove it from the queue
				if (this.tr[docName] === nextTr) {
					delete this.tr[docName];
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return res;
			})();

			this.tr[docName] = nextTr;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this.tr[docName];
		};
	}

	async createIndex(): Promise<void> {
		const collection = this.repo.getCollection();
		await collection.createIndex({
			version: 1,
			docName: 1,
			action: 1,
			clock: 1,
			part: 1,
		});
		await this.repo.syncIndexes();
	}

	getYDoc(docName: string): Promise<Doc> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
		return this._transact(docName, async (db: TldrawRepo): Promise<Doc> => {
			const updates = await getMongoUpdates(db, docName);
			const ydoc = new Doc();
			ydoc.transact(() => {
				for (let i = 0; i < updates.length; i++) {
					applyUpdate(ydoc, updates[i]);
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					updates[i] = null;
				}
			});
			if (updates.length > this.flushSize) {
				await flushDocument(db, docName, encodeStateAsUpdate(ydoc), encodeStateVector(ydoc));
			}
			return ydoc;
		});
	}

	storeUpdate(docName: string, update: Uint8Array): Promise<number> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, (db: TldrawRepo) => storeUpdate(db, docName, update));
	}

	flushDocument(docName: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, async (db: TldrawRepo) => {
			const updates = await getMongoUpdates(db, docName);
			const { update, sv } = mergeUpdates(updates);
			await flushDocument(db, docName, update, sv);
		});
	}
}
