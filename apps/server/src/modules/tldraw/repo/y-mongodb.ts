import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { EntityManager } from '@mikro-orm/mongodb';
import { MongodbAdapter } from '@modules/tldraw/repo/mongodb-adapter';
import * as promise from 'lib0/promise';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Injectable } from '@nestjs/common';
import * as U from './utils';

@Injectable()
export class YMongodb {
	private flushSize: number;

	private tr = { string: Promise<any> };

	private _transact;

	constructor(readonly configService: ConfigService<TldrawConfig, true>, private readonly _em: EntityManager) {
		this.flushSize = this.configService.get<number>('TLDRAW_DB_FLUSH_SIZE') ?? 400;
		const adapter = new MongodbAdapter(configService, _em);

		this._transact = <T>(docName: string, f: (any) => Promise<T>) => {
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

				let res = null;
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/ban-ts-comment
					// @ts-ignore
					res = await f(adapter);
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

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return this.tr[docName];
		};
	}

	getYDoc(docName: string): Promise<Doc> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
		return this._transact(docName, async (db: MongodbAdapter): Promise<Doc> => {
			const updates = await U.getMongoUpdates(db, docName);
			const ydoc = new Doc();
			ydoc.transact(() => {
				// eslint-disable-next-line no-plusplus
				for (let i = 0; i < updates.length; i++) {
					applyUpdate(ydoc, updates[i]);
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					updates[i] = null;
				}
			});
			if (updates.length > this.flushSize) {
				await U.flushDocument(db, docName, encodeStateAsUpdate(ydoc), encodeStateVector(ydoc));
			}
			return ydoc;
		});
	}

	/**
	 * Store a single document update to the database.
	 *
	 * @param {string} docName
	 * @param {Uint8Array} update
	 * @return {Promise<number>} Returns the clock of the stored update
	 */
	storeUpdate(docName: string, update: Uint8Array) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
		return this._transact(docName, (db: MongodbAdapter) => U.storeUpdate(db, docName, update));
	}

	/**
	 * The state vector (describing the state of the persisted document - see https://github.com/yjs/yjs#Document-Updates) is maintained in a separate field and constantly updated.
	 *
	 * This allows you to sync changes without actually creating a Yjs document.
	 *
	 * @param {string} docName
	 * @return {Promise<Uint8Array>}
	 */
	getStateVector(docName: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, async (db: MongodbAdapter) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const { clock, sv } = await U.readStateVector(db, docName);
			let curClock = -1;
			if (sv !== null) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				curClock = await U.getCurrentUpdateClock(db, docName);
			}
			if (sv !== null && clock === curClock) {
				return sv;
			}
			// current state vector is outdated
			const updates = await U.getMongoUpdates(db, docName);
			const { update, sv: newSv } = U.mergeUpdates(updates);
			await U.flushDocument(db, docName, update, newSv);
			return newSv;
		});
	}

	/**
	 * Get the differences directly from the database.
	 * The same as Y.encodeStateAsUpdate(ydoc, stateVector).
	 * @param {string} docName
	 * @param {Uint8Array} stateVector
	 */
	async getDiff(docName: string, stateVector: Uint8Array) {
		const ydoc = await this.getYDoc(docName);
		return encodeStateAsUpdate(ydoc, stateVector);
	}

	/**
	 * Persist some meta information in the database and associate it
	 * with a document. It is up to you what you store here.
	 * You could, for example, store credentials here.
	 *
	 * @param {string} docName
	 * @param {string} metaKey
	 * @param {any} value
	 * @return {Promise<void>}
	 */
	setMeta(docName: string, metaKey: string, value: object) {
		/*	Unlike y-leveldb, we simply store the value here without encoding
	 		 it in a buffer beforehand. */
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
		return this._transact(docName, async (db: MongodbAdapter) => {
			await db.put(U.createDocumentMetaKey(docName, metaKey), { value });
		});
	}

	/**
	 * Retrieve a store meta value from the database. Returns undefined if the
	 * metaKey doesn't exist.
	 *
	 * @param {string} docName
	 * @param {string} metaKey
	 * @return {Promise<any>}
	 */
	getMeta(docName: string, metaKey: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
		return this._transact(docName, async (db: MongodbAdapter) => {
			const res = await db.get({
				...U.createDocumentMetaKey(docName, metaKey),
			});
			if (!res?.value) {
				return undefined;
			}
			return res.value;
		});
	}

	/**
	 * Delete a store meta value.
	 *
	 * @param {string} docName
	 * @param {string} metaKey
	 * @return {Promise<any>}
	 */
	delMeta(docName: string, metaKey: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, (db: MongodbAdapter) =>
			db.del({
				...U.createDocumentMetaKey(docName, metaKey),
			})
		);
	}

	/**
	 * Retrieve the names of all stored documents.
	 *
	 * @return {Promise<string[]>}
	 */
	getAllDocNames() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact('global', async (db: MongodbAdapter) => {
			const docs = await U.getAllSVDocs(db);
			return docs.map((doc) => doc.docName);
		});
	}

	/**
	 * Retrieve the state vectors of all stored documents.
	 * You can use this to sync two y-leveldb instances.
	 * !Note: The state vectors might be outdated if the associated document
	 * is not yet flushed. So use with caution.
	 * @return {Promise<{ name: string, sv: Uint8Array, clock: number }[]>}
	 * @todo may not work?
	 */
	getAllDocStateVectors() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact('global', async (db: MongodbAdapter) => {
			const docs = await U.getAllSVDocs(db);
			return docs.map((doc) => {
				const { sv, clock } = U.decodeMongodbStateVector(doc.value);
				return { name: doc.docName, sv, clock };
			});
		});
	}

	/**
	 * Internally y-mongodb stores incremental updates. You can merge all document
	 * updates to a single entry. You probably never have to use this.
	 * It is done automatically every $options.flushsize (default 400) transactions.
	 *
	 * @param {string} docName
	 * @return {Promise<void>}
	 */
	flushDocument(docName: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, async (db: MongodbAdapter) => {
			const updates = await U.getMongoUpdates(db, docName);
			const { update, sv } = U.mergeUpdates(updates);
			await U.flushDocument(db, docName, update, sv);
		});
	}
}
