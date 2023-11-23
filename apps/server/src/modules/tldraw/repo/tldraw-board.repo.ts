import { Injectable } from '@nestjs/common';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { YMongodb } from '@modules/tldraw/repo/y-mongodb';
import { calculateDiff } from '../utils';
import { WsSharedDocDo } from '../types';

@Injectable()
export class TldrawBoardRepo {
	constructor(readonly mdb: YMongodb) {}

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
