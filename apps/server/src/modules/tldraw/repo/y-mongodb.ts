import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import * as promise from 'lib0/promise';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Injectable } from '@nestjs/common';
import { TldrawRepo } from '@modules/tldraw/repo/tldraw.repo';
import { TldrawDrawing } from '@modules/tldraw/entities';
import { Buffer } from 'buffer';
import * as binary from 'lib0/binary';
import * as encoding from 'lib0/encoding';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class YMongodb {
	private MAX_DOCUMENT_SIZE = 15000000;

	private readonly flushSize: number;

	private tr = { string: Promise<never> };

	private readonly _transact;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly repo: TldrawRepo,
		private readonly logger: LegacyLogger
	) {
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
					this.logger.error('Error during saving transaction', err);
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
		return this._transact(docName, async (): Promise<Doc> => {
			const updates = await this.getMongoUpdates(docName);
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
				await this.flushDocument(docName, encodeStateAsUpdate(ydoc), encodeStateVector(ydoc));
			}
			return ydoc;
		});
	}

	storeUpdateTransactional(docName: string, update: Uint8Array): Promise<number> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, () => this.storeUpdate(docName, update));
	}

	flushDocumentTransactional(docName: string) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
		return this._transact(docName, async () => {
			const updates = await this.getMongoUpdates(docName);
			const { update, sv } = this.mergeUpdates(updates);
			await this.flushDocument(docName, update, sv);
		});
	}

	private async clearUpdatesRange(docName: string, from: number, to: number) {
		return this.repo.del({
			docName,
			clock: {
				$gte: from,
				$lt: to,
			},
		});
	}

	private getMongoBulkData(query: object, opts: object) {
		return this.repo.readAsCursor(query, opts);
	}

	private mergeDocsTogether(doc: TldrawDrawing, docs: TldrawDrawing[], docIndex: number) {
		const parts = [Buffer.from(doc.value.buffer)];
		let currentPartId: number | undefined = doc.part;
		for (let i = docIndex + 1; i < docs.length; i++) {
			const part = docs[i];
			if (part.clock === doc.clock) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				if (currentPartId !== part.part - 1) {
					throw new Error('Couldnt merge updates together because a part is missing!');
				}
				parts.push(Buffer.from(part.value.buffer));
				currentPartId = part.part;
			} else {
				break;
			}
		}

		return parts;
	}

	/**
	 * Convert the mongo document array to an array of values (as buffers)
	 */
	private convertMongoUpdates(docs: TldrawDrawing[]) {
		if (!Array.isArray(docs) || !docs.length) return [];

		const updates: Buffer[] = [];
		for (let i = 0; i < docs.length; i++) {
			const doc = docs[i];
			if (!doc.part) {
				updates.push(doc.value);
			} else if (doc.part === 1) {
				// merge the docs together that got split because of mongodb size limits
				const parts = this.mergeDocsTogether(doc, docs, i);
				updates.push(Buffer.concat(parts));
			}
		}
		return updates;
	}

	/**
	 * Get all document updates for a specific document.
	 */
	private async getMongoUpdates(docName: string, opts = {}) {
		const docs = await this.getMongoBulkData(this.createDocumentUpdateKey(docName), opts);
		return this.convertMongoUpdates(docs);
	}

	private getCurrentUpdateClock(docName: string) {
		return this.getMongoBulkData(
			{
				...this.createDocumentUpdateKey(docName, 0),
				clock: {
					$gte: 0,
					$lt: binary.BITS32,
				},
			},
			{ reverse: true, limit: 1 }
		).then((updates) => {
			if (updates.length === 0) {
				return -1;
			}
			return updates[0].clock;
		});
	}

	private async writeStateVector(docName: string, sv: Uint8Array, clock: number) {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, clock);
		encoding.writeVarUint8Array(encoder, sv);
		await this.repo.put(this.createDocumentStateVectorKey(docName), {
			value: Buffer.from(encoding.toUint8Array(encoder)),
		});
	}

	private async storeUpdate(docName: string, update: Uint8Array) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const clock: number = await this.getCurrentUpdateClock(docName);
		if (clock === -1) {
			// make sure that a state vector is always written, so we can search for available documents
			const ydoc = new Doc();
			applyUpdate(ydoc, update);
			const sv = encodeStateVector(ydoc);
			await this.writeStateVector(docName, sv, 0);
		}

		const value = Buffer.from(update);
		//  if our buffer exceeds it, we store the update in multiple documents
		if (value.length <= this.MAX_DOCUMENT_SIZE) {
			await this.repo.put(this.createDocumentUpdateKey(docName, clock + 1), {
				value,
			});
		} else {
			const totalChunks = Math.ceil(value.length / this.MAX_DOCUMENT_SIZE);

			const putPromises: Promise<any>[] = [];
			for (let i = 0; i < totalChunks; i++) {
				const start = i * this.MAX_DOCUMENT_SIZE;
				const end = Math.min(start + this.MAX_DOCUMENT_SIZE, value.length);
				const chunk = value.subarray(start, end);

				putPromises.push(
					this.repo.put({ ...this.createDocumentUpdateKey(docName, clock + 1), part: i + 1 }, { value: chunk })
				);
			}

			await Promise.all(putPromises);
		}

		return clock + 1;
	}

	/**
	 * For now this is a helper method that creates a Y.Doc and then re-encodes a document update.
	 * In the future this will be handled by Yjs without creating a Y.Doc (constant memory consumption).
	 */
	private mergeUpdates(updates: Array<Uint8Array>) {
		const ydoc = new Doc();
		ydoc.transact(() => {
			for (const element of updates) {
				applyUpdate(ydoc, element);
			}
		});
		return { update: encodeStateAsUpdate(ydoc), sv: encodeStateVector(ydoc) };
	}

	/**
	 * Merge all MongoDB documents of the same yjs document together.
	 */
	private async flushDocument(docName: string, stateAsUpdate: Uint8Array, stateVector: Uint8Array) {
		const clock = await this.storeUpdate(docName, stateAsUpdate);
		await this.writeStateVector(docName, stateVector, clock);
		await this.clearUpdatesRange(docName, 0, clock);
		return clock;
	}

	/**
	 * Create a unique key for a update message.
	 */
	private createDocumentUpdateKey(docName: string, clock?: number) {
		if (clock !== undefined) {
			return {
				version: 'v1',
				action: 'update',
				docName,
				clock,
			};
		}
		return {
			version: 'v1',
			action: 'update',
			docName,
		};
	}

	private createDocumentStateVectorKey(docName: string) {
		return {
			docName,
			version: 'v1_sv',
		};
	}
}
