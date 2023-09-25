import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import { MongodbPersistence } from 'y-mongodb-provider';
import { WSSharedDoc } from '@src/modules/tldraw/types/ws-shared-doc';

// eslint-disable-next-line consistent-return
export const getYDocFromMdb = async (mdb: MongodbPersistence, docName: string) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
	const yDoc = await mdb.getYDoc(docName);
	if (yDoc instanceof Doc) {
		return yDoc;
	}
};

export const calculateDiff = (diff: Uint8Array) =>
	diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0);

export const updateStoredDocWithDiff = (mdb: MongodbPersistence, docName: string, diff: Uint8Array) => {
	if (calculateDiff(diff) > 0) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		mdb.storeUpdate(docName, diff);
	}
};

export const updateDocument = async (mdb: MongodbPersistence, docName: string, ydoc: WSSharedDoc) => {
	const persistedYdoc = await getYDocFromMdb(mdb, docName);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const persistedStateVector = encodeStateVector(persistedYdoc);
	const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
	updateStoredDocWithDiff(mdb, docName, diff);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

	ydoc.on('update', (update) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		mdb.storeUpdate(docName, update);
	});

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	persistedYdoc.destroy();
};
