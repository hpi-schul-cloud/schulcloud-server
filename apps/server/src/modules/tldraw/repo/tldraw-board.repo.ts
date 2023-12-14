import { Injectable } from '@nestjs/common';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Logger } from '@src/core/logger';
import { MongoTransactionError } from '../loggable';
import { calculateDiff } from '../utils';
import { WsSharedDocDo } from '../domain';
import { YMongodb } from './y-mongodb';

@Injectable()
export class TldrawBoardRepo {
	constructor(readonly mdb: YMongodb, private readonly logger: Logger) {
		this.logger.setContext(TldrawBoardRepo.name);
	}

	public async createDbIndex(): Promise<void> {
		await this.mdb.createIndex();
	}

	public async getYDocFromMdb(docName: string): Promise<Doc> {
		const yDoc = await this.mdb.getYDoc(docName);
		return yDoc;
	}

	public updateStoredDocWithDiff(docName: string, diff: Uint8Array): void {
		const calc = calculateDiff(diff);
		if (calc > 0) {
			this.mdb
				.storeUpdateTransactional(docName, diff)
				.catch((err) => this.logger.warning(new MongoTransactionError(err as Error)));
		}
	}

	public async updateDocument(docName: string, ydoc: WsSharedDocDo): Promise<void> {
		const persistedYdoc = await this.getYDocFromMdb(docName);
		const persistedStateVector = encodeStateVector(persistedYdoc);
		const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
		this.updateStoredDocWithDiff(docName, diff);

		applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

		ydoc.on('update', (update: Uint8Array) => {
			this.mdb
				.storeUpdateTransactional(docName, update)
				.catch((err) => this.logger.warning(new MongoTransactionError(err as Error)));
		});

		persistedYdoc.destroy();
	}

	public async flushDocument(docName: string): Promise<void> {
		await this.mdb.flushDocumentTransactional(docName);
	}
}
