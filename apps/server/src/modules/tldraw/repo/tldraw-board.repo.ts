import { Injectable } from '@nestjs/common';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { YMongodb } from '@modules/tldraw/repo/y-mongodb';
import { LegacyLogger } from '@src/core/logger';
import { calculateDiff } from '../utils';
import { WsSharedDocDo } from '../types';

@Injectable()
export class TldrawBoardRepo {
	constructor(readonly mdb: YMongodb, private readonly logger: LegacyLogger) {
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
			this.mdb.storeUpdate(docName, diff).catch((err) => this.logger.error(err));
		}
	}

	public async updateDocument(docName: string, ydoc: WsSharedDocDo): Promise<void> {
		const persistedYdoc = await this.getYDocFromMdb(docName);
		const persistedStateVector = encodeStateVector(persistedYdoc);
		const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
		this.updateStoredDocWithDiff(docName, diff);

		applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

		ydoc.on('update', (update: Uint8Array) => {
			this.mdb.storeUpdate(docName, update).catch((err) => this.logger.error(err));
		});

		persistedYdoc.destroy();
	}

	public async flushDocument(docName: string): Promise<void> {
		await this.mdb.flushDocument(docName);
	}
}
