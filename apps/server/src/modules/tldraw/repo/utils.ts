import { MongodbAdapter } from '@modules/tldraw/repo/mongodb-adapter';
import { TldrawDrawing } from '@modules/tldraw/entities';
import * as binary from 'lib0/binary';
import * as encoding from 'lib0/encoding';
import { Buffer } from 'buffer';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';

const MAX_DOCUMENT_SIZE = 15000000;

/**
 * Remove all documents from db with Clock between $from and $to
 */
export const clearUpdatesRange = async (db: MongodbAdapter, docName: string, from: number, to: number) =>
	db.del({
		docName,
		clock: {
			$gte: from,
			$lt: to,
		},
	});

/**
 * Create a unique key for a update message.
 */
export const createDocumentUpdateKey = (docName: string, clock?: number) => {
	if (clock !== undefined) {
		return {
			version: 'v1',
			action: 'update',
			docName,
			clock,
		};
	}
	return {
		version: 'v1',
		action: 'update',
		docName,
	};
};

export const createDocumentStateVectorKey = (docName: string) => {
	return {
		docName,
		version: 'v1_sv',
	};
};

export const getMongoBulkData = (db: MongodbAdapter, query: object, opts: object) => db.readAsCursor(query, opts);

/**
 * Convert the mongo document array to an array of values (as buffers)
 */
const convertMongoUpdates = (docs: TldrawDrawing[]) => {
	if (!Array.isArray(docs) || !docs.length) return [];

	const updates: Buffer[] = [];
	for (let i = 0; i < docs.length; i++) {
		const doc = docs[i];
		if (!doc.part) {
			updates.push(doc.value.buffer);
		} else if (doc.part === 1) {
			// merge the docs together that got split because of mongodb size limits
			const parts = [Buffer.from(doc.value.buffer)];
			let j;
			let currentPartId: number | undefined = doc.part;
			for (j = i + 1; j < docs.length; j++) {
				const part = docs[j];
				if (part.clock === doc.clock) {
					if (currentPartId !== part.part - 1) {
						throw new Error('Couldnt merge updates together because a part is missing!');
					}
					parts.push(Buffer.from(part.value.buffer));
					currentPartId = part.part;
				} else {
					break;
				}
			}
			updates.push(Buffer.concat(parts));
		}
	}
	return updates;
};

/**
 * Get all document updates for a specific document.
 */
export const getMongoUpdates = async (db: MongodbAdapter, docName: string, opts = {}) => {
	const docs = await getMongoBulkData(db, createDocumentUpdateKey(docName), opts);
	return convertMongoUpdates(docs);
};

export const getCurrentUpdateClock = (db: MongodbAdapter, docName: string) =>
	getMongoBulkData(
		db,
		{
			...createDocumentUpdateKey(docName, 0),
			clock: {
				$gte: 0,
				$lt: binary.BITS32,
			},
		},
		{ reverse: true, limit: 1 }
	).then((updates) => {
		if (updates.length === 0) {
			return -1;
		}
		return updates[0].clock;
	});

export const writeStateVector = async (db: MongodbAdapter, docName: string, sv: Uint8Array, clock: number) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, clock);
	encoding.writeVarUint8Array(encoder, sv);
	await db.put(createDocumentStateVectorKey(docName), {
		value: Buffer.from(encoding.toUint8Array(encoder)),
	});
};

export const storeUpdate = async (db: MongodbAdapter, docName: string, update: Uint8Array) => {
	const clock: number = await getCurrentUpdateClock(db, docName);
	if (clock === -1) {
		// make sure that a state vector is always written, so we can search for available documents
		const ydoc = new Doc();
		applyUpdate(ydoc, update);
		const sv = encodeStateVector(ydoc);
		await writeStateVector(db, docName, sv, 0);
	}

	const value = Buffer.from(update);
	//  if our buffer exceeds it, we store the update in multiple documents
	if (value.length <= MAX_DOCUMENT_SIZE) {
		await db.put(createDocumentUpdateKey(docName, clock + 1), {
			value,
		});
	} else {
		const totalChunks = Math.ceil(value.length / MAX_DOCUMENT_SIZE);

		const putPromises: Promise<any>[] = [];
		for (let i = 0; i < totalChunks; i++) {
			const start = i * MAX_DOCUMENT_SIZE;
			const end = Math.min(start + MAX_DOCUMENT_SIZE, value.length);
			const chunk = value.subarray(start, end);

			putPromises.push(db.put({ ...createDocumentUpdateKey(docName, clock + 1), part: i + 1 }, { value: chunk }));
		}

		await Promise.all(putPromises);
	}

	return clock + 1;
};

/**
 * For now this is a helper method that creates a Y.Doc and then re-encodes a document update.
 * In the future this will be handled by Yjs without creating a Y.Doc (constant memory consumption).
 */
export const mergeUpdates = (updates: Array<Uint8Array>) => {
	const ydoc = new Doc();
	ydoc.transact(() => {
		for (const element of updates) {
			applyUpdate(ydoc, element);
		}
	});
	return { update: encodeStateAsUpdate(ydoc), sv: encodeStateVector(ydoc) };
};

/**
 * Merge all MongoDB documents of the same yjs document together.
 */
export const flushDocument = async (
	db: MongodbAdapter,
	docName: string,
	stateAsUpdate: Uint8Array,
	stateVector: Uint8Array
) => {
	const clock = await storeUpdate(db, docName, stateAsUpdate);
	await writeStateVector(db, docName, stateVector, clock);
	await clearUpdatesRange(db, docName, 0, clock);
	return clock;
};
