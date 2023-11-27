import { Injectable } from '@nestjs/common';
import { MongodbPersistence } from 'y-mongodb-provider';
import { ConfigService } from '@nestjs/config';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { TldrawConfig } from '../config';
import { calculateDiff } from '../utils';
import { WsSharedDocDo } from '../domain';

@Injectable()
export class TldrawBoardRepo {
	public connectionString: string;

	public collectionName: string;

	public flushSize: number;

	public multipleCollections: boolean;

	public mdb: MongodbPersistence;

	constructor(public readonly configService: ConfigService<TldrawConfig, true>) {
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
	public async getYDocFromMdb(docName: string): Promise<Doc> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
		const yDoc = await this.mdb.getYDoc(docName);
		if (yDoc instanceof Doc) {
			return yDoc;
		}
	}

	public updateStoredDocWithDiff(docName: string, diff: Uint8Array): void {
		const calc = calculateDiff(diff);
		if (calc > 0) {
			void this.mdb.storeUpdate(docName, diff);
		}
	}

	public async updateDocument(docName: string, ydoc: WsSharedDocDo): Promise<void> {
		const persistedYdoc = await this.getYDocFromMdb(docName);
		const persistedStateVector = encodeStateVector(persistedYdoc);
		const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
		this.updateStoredDocWithDiff(docName, diff);

		applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

		ydoc.on('update', (update: Uint8Array) => {
			void this.mdb.storeUpdate(docName, update);
		});

		persistedYdoc.destroy();
	}

	public async flushDocument(docName: string): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		await this.mdb.flushDocument(docName);
	}
}
