import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '../config';
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

	public async getYDocFromMdb(docName: string): Promise<WsSharedDocDo> {
		const yDoc = await this.mdb.getYDoc(docName);
		return yDoc;
	}

	public async compressDocument(docName: string): Promise<void> {
		await this.mdb.compressDocumentTransactional(docName);
	}

	public async storeUpdate(docName: string, update: Uint8Array): Promise<void> {
		const currentClock = await this.mdb.storeUpdateTransactional(docName, update);

		if (currentClock % this.compressThreshold === 0) {
			await this.compressDocument(docName);
		}
	}
}
