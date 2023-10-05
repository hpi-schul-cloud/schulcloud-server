import { Injectable } from '@nestjs/common';
import { MongodbPersistence } from 'y-mongodb-provider';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@src/modules/tldraw/config';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { calculateDiff } from '@src/modules/tldraw/utils';
import { WsSharedDocDo } from '@src/modules/tldraw/types';

@Injectable()
export class TldrawBoardRepo {
	connectionString: string;

	collectionName: string;

	flushSize: number;

	multipleCollections: boolean;

	mdb: MongodbPersistence;

	constructor(readonly configService: ConfigService<TldrawConfig, true>) {
		this.connectionString = this.configService.get<string>('CONNECTION_STRING');
		this.collectionName = this.configService.get<string>('TLDRAW_DB_COLLECTION_NAME') ?? 'drawings';
		this.flushSize = this.configService.get<number>('TLDRAW_DB_FLUSH_SIZE') ?? 400;
		this.multipleCollections = this.configService.get<boolean>('TLDRAW_DB_MULTIPLE_COLLECTIONS');

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
		this.mdb = new MongodbPersistence(this.connectionString, {
			collectionName: this.collectionName,
			flushSize: this.flushSize,
			multipleCollections: this.multipleCollections,
		});
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// eslint-disable-next-line consistent-return
	async getYDocFromMdb(docName: string): Promise<Doc> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
		const yDoc = await this.mdb.getYDoc(docName);
		if (yDoc instanceof Doc) {
			return yDoc;
		}
	}

	updateStoredDocWithDiff(docName: string, diff: Uint8Array) {
		const clac = calculateDiff(diff);
		if (clac > 0) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
			this.mdb.storeUpdate(docName, diff);
		}
	}

	async updateDocument(docName: string, ydoc: WsSharedDocDo) {
		const persistedYdoc = await this.getYDocFromMdb(docName);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const persistedStateVector = encodeStateVector(persistedYdoc);
		const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
		this.updateStoredDocWithDiff(docName, diff);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

		ydoc.on('update', (update) => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
			this.mdb.storeUpdate(docName, update);
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		persistedYdoc.destroy();
	}

	async flushDocument(docName) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		await this.mdb.flushDocument(docName);
	}
}
