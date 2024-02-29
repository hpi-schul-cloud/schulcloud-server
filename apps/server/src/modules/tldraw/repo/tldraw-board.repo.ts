import { Injectable } from '@nestjs/common';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { Logger } from '@src/core/logger';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@modules/tldraw/config';
import { MongoTransactionErrorLoggable } from '../loggable';
import { calculateDiff } from '../utils';
import { WsSharedDocDo } from '../domain';
import { YMongodb } from './y-mongodb';

@Injectable()
export class TldrawBoardRepo {
	private readonly compressThreshold: number;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		readonly mdb: YMongodb,
		private readonly logger: Logger
	) {
		this.logger.setContext(TldrawBoardRepo.name);

		this.compressThreshold = this.configService.get<number>('TLDRAW_DB_COMPRESS_THRESHOLD');
	}

	public async createDbIndex(): Promise<void> {
		await this.mdb.createIndex();
	}

	public async getYDocFromMdb(docName: string): Promise<Doc> {
		const yDoc = await this.mdb.getYDoc(docName);
		return yDoc;
	}

	public async updateStoredDocWithDiff(docName: string, diff: Uint8Array): Promise<void> {
		const calc = calculateDiff(diff);
		if (calc > 0) {
			await this.mdb.storeUpdateTransactional(docName, diff).catch((err) => {
				this.logger.warning(new MongoTransactionErrorLoggable(err));
				throw err;
			});
		}
	}

	public async loadDocument(docName: string, ydoc: WsSharedDocDo): Promise<void> {
		const persistedYdoc = await this.getYDocFromMdb(docName);
		const persistedStateVector = encodeStateVector(persistedYdoc);
		const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
		await this.updateStoredDocWithDiff(docName, diff);
		applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

		persistedYdoc.destroy();
	}

	public async compressDocument(docName: string): Promise<void> {
		await this.mdb.compressDocumentTransactional(docName);
	}

	public async storeUpdate(docName: string, update: Uint8Array): Promise<void> {
		await this.mdb.storeUpdateTransactional(docName, update);

		const currentClock = await this.mdb.getCurrentUpdateClock(docName);
		if (currentClock % this.compressThreshold === 0) {
			await this.compressDocument(docName);
		}
	}
}
