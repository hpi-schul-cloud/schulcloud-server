import { BulkWriteResult } from '@mikro-orm/mongodb/node_modules/mongodb';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initilisedPerformanceObserver } from '@shared/common/measure-utils';
import { DomainErrorHandler } from '@src/core';
import { Logger } from '@src/core/logger';
import { Buffer } from 'buffer';
import * as binary from 'lib0/binary';
import * as encoding from 'lib0/encoding';
import * as promise from 'lib0/promise';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector, mergeUpdates } from 'yjs';
import { TldrawConfig } from '../config';
import { WsSharedDocDo } from '../domain';
import { TldrawDrawing } from '../entities';
import { MongoTransactionErrorLoggable } from '../loggable';
import { YTransaction } from '../types';
import { KeyFactory, Version } from './key.factory';
import { TldrawRepo } from './tldraw.repo';

@Injectable()
export class YMongodb implements OnModuleInit {
	private readonly _transact: <T extends Promise<YTransaction>>(docName: string, fn: () => T) => T;

	// scope the queue of the transaction to each docName
	// this should allow concurrency for different rooms
	private tr: { docName?: Promise<YTransaction> } = {};

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly repo: TldrawRepo,
		private readonly domainErrorHandler: DomainErrorHandler,
		private readonly logger: Logger
	) {
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

				let res: YTransaction | null = null;
				try {
					res = await fn();
				} catch (err) {
					this.domainErrorHandler.exec(new MongoTransactionErrorLoggable(err));
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

	onModuleInit() {
		if (this.configService.get('PERFORMANCE_MEASURE_ENABLED') === true) {
			initilisedPerformanceObserver(this.logger);
		}
	}

	public async createIndex(): Promise<void> {
		await this.repo.ensureIndexes();
	}

	public async getAllDocumentNames(): Promise<string[]> {
		const docs = await this.repo.readAsCursor({ version: Version.V1_SV });
		const docNames = docs.map((doc) => doc.docName);

		return docNames;
	}

	public getDocument(docName: string): Promise<WsSharedDocDo> {
		// return value can be null, need to be defined
		return this._transact(docName, async (): Promise<WsSharedDocDo> => {
			const updates = await this.getMongoUpdates(docName);
			const mergedUpdates = mergeUpdates(updates);

			const gcEnabled = this.configService.get<boolean>('TLDRAW_GC_ENABLED');
			const ydoc = new WsSharedDocDo(docName, gcEnabled);
			applyUpdate(ydoc, mergedUpdates);

			return ydoc;
		});
	}

	public storeUpdateTransactional(docName: string, update: Uint8Array): Promise<number> {
		// return value can be null, need to be defined
		return this._transact(docName, () => this.storeUpdate(docName, update));
	}

	// return value is not void, need to be changed
	public compressDocumentTransactional(docName: string): Promise<void> {
		performance.mark('compressDocumentTransactional');

		return this._transact(docName, async () => {
			const updates = await this.getMongoUpdates(docName);
			const mergedUpdates = mergeUpdates(updates);

			const ydoc = new Doc();
			applyUpdate(ydoc, mergedUpdates);

			const stateAsUpdate = encodeStateAsUpdate(ydoc);
			const sv = encodeStateVector(ydoc);
			const clock = await this.storeUpdate(docName, stateAsUpdate);

			await this.writeStateVector(docName, sv, clock);
			await this.clearUpdatesRange(docName, 0, clock);

			ydoc.destroy();
			performance.measure('tldraw:YMongodb:compressDocumentTransactional', {
				start: 'compressDocumentTransactional',
				detail: { doc_name: docName, clock },
			});
		});
	}

	public async getCurrentUpdateClock(docName: string): Promise<number> {
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

	private mergeDocsTogether(
		tldrawDrawingEntity: TldrawDrawing,
		tldrawDrawingEntities: TldrawDrawing[],
		docIndex: number
	): Buffer[] {
		const parts = [Buffer.from(tldrawDrawingEntity.value.buffer)];
		let currentPartId: number | undefined = tldrawDrawingEntity.part;
		for (let i = docIndex + 1; i < tldrawDrawingEntities.length; i += 1) {
			const entity = tldrawDrawingEntities[i];

			if (!this.isSameClock(entity, tldrawDrawingEntity)) {
				break;
			}

			this.checkIfPartIsNextPartAfterCurrent(entity, currentPartId);

			parts.push(Buffer.from(entity.value.buffer));
			currentPartId = entity.part;
		}

		return parts;
	}

	/**
	 * Convert the mongo document array to an array of values (as buffers)
	 */
	private convertMongoUpdates(tldrawDrawingEntities: TldrawDrawing[]): Buffer[] {
		if (!Array.isArray(tldrawDrawingEntities) || !tldrawDrawingEntities.length) return [];

		const updates: Buffer[] = [];
		for (let i = 0; i < tldrawDrawingEntities.length; i += 1) {
			const tldrawDrawingEntity = tldrawDrawingEntities[i];

			if (!tldrawDrawingEntity.part) {
				updates.push(Buffer.from(tldrawDrawingEntity.value.buffer));
			}

			if (tldrawDrawingEntity.part === 1) {
				// merge the docs together that got split because of mongodb size limits
				const parts = this.mergeDocsTogether(tldrawDrawingEntity, tldrawDrawingEntities, i);
				updates.push(Buffer.concat(parts));
			}
		}
		return updates;
	}

	/**
	 * Get all document updates for a specific document.
	 */
	private async getMongoUpdates(docName: string, opts = {}): Promise<Buffer[]> {
		performance.mark('getMongoUpdates');
		const uniqueKey = KeyFactory.createForUpdate(docName);
		const tldrawDrawingEntities = await this.getMongoBulkData(uniqueKey, opts);

		const buffer = this.convertMongoUpdates(tldrawDrawingEntities);

		performance.measure('tldraw:YMongodb:getMongoUpdates', {
			start: 'getMongoUpdates',
			detail: { doc_name: docName, loaded_tldraw_entities_total: tldrawDrawingEntities.length },
		});

		return buffer;
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

		const maxDocumentSize = this.configService.get<number>('TLDRAW_MAX_DOCUMENT_SIZE');
		const value = Buffer.from(update);
		//  if our buffer exceeds maxDocumentSize, we store the update in multiple documents
		if (value.length <= maxDocumentSize) {
			const uniqueKey = KeyFactory.createForUpdate(docName, clock + 1);

			await this.repo.put(uniqueKey, {
				value,
			});
		} else {
			const totalChunks = Math.ceil(value.length / maxDocumentSize);

			const putPromises: Promise<TldrawDrawing | null>[] = [];
			for (let i = 0; i < totalChunks; i += 1) {
				const start = i * maxDocumentSize;
				const end = Math.min(start + maxDocumentSize, value.length);
				const chunk = value.subarray(start, end);

				putPromises.push(
					this.repo.put({ ...KeyFactory.createForUpdate(docName, clock + 1), part: i + 1 }, { value: chunk })
				);
			}

			await Promise.all(putPromises);
		}

		return clock + 1;
	}

	private isSameClock(tldrawDrawingEntity1: TldrawDrawing, tldrawDrawingEntity2: TldrawDrawing): boolean {
		return tldrawDrawingEntity1.clock === tldrawDrawingEntity2.clock;
	}

	private checkIfPartIsNextPartAfterCurrent(
		tldrawDrawingEntity: TldrawDrawing,
		currentPartId: number | undefined
	): void {
		if (tldrawDrawingEntity.part === undefined || currentPartId !== tldrawDrawingEntity.part - 1) {
			throw new Error('Could not merge updates together because a part is missing');
		}
	}

	private extractClock(tldrawDrawingEntities: TldrawDrawing[]): number {
		if (tldrawDrawingEntities.length === 0 || tldrawDrawingEntities[0].clock == null) {
			return -1;
		}
		return tldrawDrawingEntities[0].clock;
	}
}
