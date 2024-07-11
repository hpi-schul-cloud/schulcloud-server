import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '../config';
import { WsSharedDocDo } from '../domain';
import { YMongodb } from './y-mongodb';

@Injectable()
export class TldrawBoardRepo {
	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		readonly mdb: YMongodb,
		private readonly logger: Logger
	) {
		this.logger.setContext(TldrawBoardRepo.name);
	}

	public async createDbIndex(): Promise<void> {
		await this.mdb.createIndex();
	}

	public async getDocumentFromDb(docName: string): Promise<WsSharedDocDo> {
		// can be return null, return type of functions need to be improve
		const yDoc = await this.mdb.getDocument(docName);
		return yDoc;
	}

	public async compressDocument(docName: string): Promise<void> {
		await this.mdb.compressDocumentTransactional(docName);
	}

	public async storeUpdate(docName: string, update: Uint8Array): Promise<void> {
		const compressThreshold = this.configService.get<number>('TLDRAW_DB_COMPRESS_THRESHOLD');
		const currentClock = await this.mdb.storeUpdateTransactional(docName, update);

		if (currentClock % compressThreshold === 0) {
			await this.compressDocument(docName);
		}
	}

	public async getAllDocumentNames(): Promise<string[]> {
		const docNames = await this.mdb.getAllDocumentNames();

		return docNames;
	}
}
