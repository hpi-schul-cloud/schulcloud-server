import { ConfigService } from '@nestjs/config';
import * as promise from 'lib0/promise';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { Buffer } from 'buffer';
import * as binary from 'lib0/binary';
import * as encoding from 'lib0/encoding';
import { BulkWriteResult } from 'mongodb';
import { MongoTransactionErrorLoggable } from '../loggable';
import { TldrawDrawing } from '../entities';
import { TldrawConfig } from '../config';
import { YTransaction } from '../types';
import { TldrawRepo } from './tldraw.repo';
import { KeyFactory } from './key.factory';

@Injectable()
export class YMongodb {
	private readonly maxDocumentSize: number;

	private readonly flushSize: number;

	private readonly _transact: <T extends Promise<YTransaction>>(docName: string, fn: () => T) => T;

	// scope the queue of the transaction to each docName
	// this should allow concurrency for different rooms
	private tr: { docName?: Promise<YTransaction> } = {};

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly repo: TldrawRepo,
		private readonly logger: Logger
	) {
		this.logger.setContext(YMongodb.name);

		this.flushSize = this.configService.get<number>('TLDRAW_DB_FLUSH_SIZE');
		this.maxDocumentSize = this.configService.get<number>('TLDRAW_MAX_DOCUMENT_SIZE');

		// execute a transaction on a database
		// this will ensure that other processes are currently not writing
		this._transact = <T extends Promise<YTransaction>>(docName: string, fn: () => T): T => {
			if (!this.tr[docName]) {
				this.tr[docName] = promise.resolve();
			}

			const currTr = this.tr[docName] as T;
			let nextTr: Promise<YTransaction | null> = promise.resolve(null);

			nextTr = (async () => {
				await currTr;

				let res: YTransaction | null;
				try {
					res = await fn();
				} catch (err) {
					this.logger.warning(new MongoTransactionErrorLoggable(err));
				}

				// once the last transaction for a given docName resolves, remove it from the queue
				if (this.tr[docName] === nextTr) {
					delete this.tr[docName];
				}

				return res;
			})();

			this.tr[docName] = nextTr;

			return this.tr[docName] as T;
		};
	}

	public async createIndex(): Promise<void> {
		await this.repo.ensureIndexes();
	}

	public getYDoc(docName: string): Promise<Doc> {
		return this._transact(docName, async (): Promise<Doc> => {
			const updates = await this.getMongoUpdates(docName);
			const ydoc = new Doc();
			ydoc.transact(() => {
				for (const element of updates) {
					applyUpdate(ydoc, element);
				}
			});
			if (updates.length > this.flushSize) {
				await this.flushDocument(docName, encodeStateAsUpdate(ydoc), encodeStateVector(ydoc));
			}
			return ydoc;
		});
	}

	public storeUpdateTransactional(docName: string, update: Uint8Array): Promise<number> {
		return this._transact(docName, () => this.storeUpdate(docName, update));
	}

	public flushDocumentTransactional(docName: string): Promise<void> {
		return this._transact(docName, async () => {
			const updates = await this.getMongoUpdates(docName);
			const { update, sv } = this.mergeUpdates(updates);
			await this.flushDocument(docName, update, sv);
		});
	}

	private async clearUpdatesRange(docName: string, from: number, to: number): Promise<BulkWriteResult> {
		return this.repo.del({
			docName,
			clock: {
				$gte: from,
				$lt: to,
			},
		});
	}

	private getMongoBulkData(query: object, opts: object): Promise<TldrawDrawing[]> {
		return this.repo.readAsCursor(query, opts);
	}

	private mergeDocsTogether(doc: TldrawDrawing, docs: TldrawDrawing[], docIndex: number): Buffer[] {
		const parts = [Buffer.from(doc.value.buffer)];
		let currentPartId: number | undefined = doc.part;
		for (let i = docIndex + 1; i < docs.length; i += 1) {
			const part = docs[i];

			if (!this.isSameClock(part, doc)) {
				break;
			}

			this.checkIfPartIsNextPartAfterCurrent(part, currentPartId);

			parts.push(Buffer.from(part.value.buffer));
			currentPartId = part.part;
		}

		return parts;
	}

	/**
	 * Convert the mongo document array to an array of values (as buffers)
	 */
	private convertMongoUpdates(docs: TldrawDrawing[]): Buffer[] {
		if (!Array.isArray(docs) || !docs.length) return [];

		const updates: Buffer[] = [];
		for (let i = 0; i < docs.length; i += 1) {
			const doc = docs[i];

			if (!doc.part) {
				updates.push(Buffer.from(doc.value.buffer));
			}

			if (doc.part === 1) {
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
	private async getMongoUpdates(docName: string, opts = {}): Promise<Buffer[]> {
		const uniqueKey = KeyFactory.createForUpdate(docName);
		const docs = await this.getMongoBulkData(uniqueKey, opts);

		return this.convertMongoUpdates(docs);
	}

	private async getCurrentUpdateClock(docName: string): Promise<number> {
		const updates = await this.getMongoBulkData(
			{
				...KeyFactory.createForUpdate(docName, 0),
				clock: {
					$gte: 0,
					$lt: binary.BITS32,
				},
			},
			{ reverse: true, limit: 1 }
		);

		const clock = this.extractClock(updates);

		return clock;
	}

	private async writeStateVector(docName: string, sv: Uint8Array, clock: number): Promise<void> {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, clock);
		encoding.writeVarUint8Array(encoder, sv);
		const uniqueKey = KeyFactory.createForInsert(docName);

		await this.repo.put(uniqueKey, {
			value: Buffer.from(encoding.toUint8Array(encoder)),
		});
	}

	private async storeUpdate(docName: string, update: Uint8Array): Promise<number> {
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
		if (value.length <= this.maxDocumentSize) {
			const uniqueKey = KeyFactory.createForUpdate(docName, clock + 1);

			await this.repo.put(uniqueKey, {
				value,
			});
		} else {
			const totalChunks = Math.ceil(value.length / this.maxDocumentSize);

			const putPromises: Promise<TldrawDrawing | null>[] = [];
			for (let i = 0; i < totalChunks; i += 1) {
				const start = i * this.maxDocumentSize;
				const end = Math.min(start + this.maxDocumentSize, value.length);
				const chunk = value.subarray(start, end);

				putPromises.push(
					this.repo.put({ ...KeyFactory.createForUpdate(docName, clock + 1), part: i + 1 }, { value: chunk })
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
	private mergeUpdates(updates: Array<Uint8Array>): { update: Uint8Array; sv: Uint8Array } {
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
	private async flushDocument(docName: string, stateAsUpdate: Uint8Array, stateVector: Uint8Array): Promise<number> {
		const clock = await this.storeUpdate(docName, stateAsUpdate);
		await this.writeStateVector(docName, stateVector, clock);
		await this.clearUpdatesRange(docName, 0, clock);
		return clock;
	}

	private isSameClock(doc1: TldrawDrawing, doc2: TldrawDrawing): boolean {
		return doc1.clock === doc2.clock;
	}

	private checkIfPartIsNextPartAfterCurrent(part: TldrawDrawing, currentPartId: number | undefined): void {
		if (part.part === undefined || currentPartId !== part.part - 1) {
			throw new Error('Could not merge updates together because a part is missing');
		}
	}

	private extractClock(updates: TldrawDrawing[]): number {
		if (updates.length === 0 || updates[0].clock == null) {
			return -1;
		}
		return updates[0].clock;
	}
}
