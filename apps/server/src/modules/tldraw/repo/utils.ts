import { MongodbAdapter } from '@modules/tldraw/repo/mongodb-adapter';
import { TldrawDrawing } from '@modules/tldraw/entities';
import * as binary from 'lib0/binary';
import * as encoding from 'lib0/encoding';
import { Buffer } from 'buffer';
import { applyUpdate, Doc, encodeStateAsUpdate, encodeStateVector } from 'yjs';
import * as decoding from 'lib0/decoding';

const MAX_DOCUMENT_SIZE = 15000000;

/**
 * Remove all documents from db with Clock between $from and $to
 *
 * @param {any} db
 * @param {string} docName
 * @param {number} from Greater than or equal
 * @param {number} to lower than (not equal)
 * @return {Promise<void>}
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
 * @param {string} docName
 * @param {number} [clock] must be unique
 * @return {Object} [opts.version, opts.docName, opts.action, opts.clock]
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

/**
 * We have a separate state vector key so we can iterate efficiently over all documents
 * @param {string} docName
 * @return {Object} [opts.docName, opts.version]
 */
export const createDocumentStateVectorKey = (docName: string) => {
	return {
		docName,
		version: 'v1_sv',
	};
};

/**
 * @param {string} docName
 * @param {string} metaKey
 * @return {Object} [opts.docName, opts.version, opts.docType, opts.metaKey]
 */
export const createDocumentMetaKey = (docName: string, metaKey: string) => {
	return {
		version: 'v1',
		docName,
		metaKey: `meta_${metaKey}`,
	};
};

/**
 * @param {any} db
 * @param {object} query
 * @param {object} opts
 * @return {Promise<any[]>}
 */
export const getMongoBulkData = (db: MongodbAdapter, query: object, opts: object) => db.readAsCursor(query, opts);

/**
 * Convert the mongo document array to an array of values (as buffers)
 *
 * @param {any[]} docs
 * @return {Buffer[]}
 */
const convertMongoUpdates = (docs: TldrawDrawing[]) => {
	if (!Array.isArray(docs) || !docs.length) return [];

	const updates: Buffer[] = [];
	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < docs.length; i++) {
		const doc = docs[i];
		if (!doc.part) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			updates.push(doc.value);
		} else if (doc.part === 1) {
			// merge the docs together that got split because of mongodb size limits
			const parts = [Buffer.from(doc.value)];
			let j;
			let currentPartId: number | undefined = doc.part;
			// eslint-disable-next-line no-plusplus
			for (j = i + 1; j < docs.length; j++) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const part = docs[j];
				if (part.clock === doc.clock) {
					// eslint-disable-next-line no-unsafe-optional-chaining,@typescript-eslint/ban-ts-comment
					// @ts-ignore
					if (currentPartId !== part.part - 1) {
						throw new Error('Couldnt merge updates together because a part is missing!');
					}
					parts.push(Buffer.from(part.value));
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
 *
 * @param {any} db
 * @param {string} docName
 * @param {any} [opts]
 * @return {Promise<any[]>}
 */
export const getMongoUpdates = async (db: MongodbAdapter, docName: string, opts = {}) => {
	const docs = await getMongoBulkData(db, createDocumentUpdateKey(docName), opts);
	return convertMongoUpdates(docs);
};

/**
 * @param {any} db
 * @param {string} docName
 * @return {Promise<number>} Returns -1 if this document doesn't exist yet
 */
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

/**
 * @param {any} db
 * @param {string} docName
 * @param {Uint8Array} sv state vector
 * @param {number} clock current clock of the document so we can determine
 * when this statevector was created
 */
export const writeStateVector = async (db: MongodbAdapter, docName: string, sv: Uint8Array, clock: number) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, clock);
	encoding.writeVarUint8Array(encoder, sv);
	await db.put(createDocumentStateVectorKey(docName), {
		value: Buffer.from(encoding.toUint8Array(encoder)),
	});
};

/**
 * @param {any} db
 * @param {string} docName
 * @param {Uint8Array} update
 * @return {Promise<number>} Returns the clock of the stored update
 */
export const storeUpdate = async (db: MongodbAdapter, docName: string, update: Uint8Array) => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const clock: number = await getCurrentUpdateClock(db, docName);
	if (clock === -1) {
		// make sure that a state vector is always written, so we can search for available documents
		const ydoc = new Doc();
		applyUpdate(ydoc, update);
		const sv = encodeStateVector(ydoc);
		await writeStateVector(db, docName, sv, 0);
	}

	const value = Buffer.from(update);
	// mongodb has a maximum document size of 16MB;
	//  if our buffer exceeds it, we store the update in multiple documents
	if (value.length <= MAX_DOCUMENT_SIZE) {
		await db.put(createDocumentUpdateKey(docName, clock + 1), {
			value,
		});
	} else {
		const totalChunks = Math.ceil(value.length / MAX_DOCUMENT_SIZE);

		const putPromises: Promise<any>[] = [];
		// eslint-disable-next-line no-plusplus
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
 *
 * @param {Array<Uint8Array>} updates
 * @return {{update:Uint8Array, sv: Uint8Array}}
 */
export const mergeUpdates = (updates: Array<Uint8Array>) => {
	const ydoc = new Doc();
	ydoc.transact(() => {
		// eslint-disable-next-line no-plusplus
		for (let i = 0; i < updates.length; i++) {
			applyUpdate(ydoc, updates[i]);
		}
	});
	return { update: encodeStateAsUpdate(ydoc), sv: encodeStateVector(ydoc) };
};

export const decodeMongodbStateVector = (buf) => {
	let decoder;
	if (Buffer.isBuffer(buf)) {
		decoder = decoding.createDecoder(buf);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	} else if (Buffer.isBuffer(buf?.buffer)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
		decoder = decoding.createDecoder(buf.buffer);
	} else {
		throw new Error('No buffer provided at decodeMongodbStateVector()');
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const clock = decoding.readVarUint(decoder);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	const sv = decoding.readVarUint8Array(decoder);
	return { sv, clock };
};

/**
 * @param {any} db
 * @param {string} docName
 */
export const readStateVector = async (db: MongodbAdapter, docName: string) => {
	const doc = await db.get({ ...createDocumentStateVectorKey(docName) });
	if (!doc?.value) {
		// no state vector created yet or no document exists
		return { sv: null, clock: -1 };
	}
	return decodeMongodbStateVector(doc.value);
};

export const getAllSVDocs = async (db: MongodbAdapter) => db.readAsCursor({ version: 'v1_sv' });

/**
 * Merge all MongoDB documents of the same yjs document together.
 * @param {any} db
 * @param {string} docName
 * @param {Uint8Array} stateAsUpdate
 * @param {Uint8Array} stateVector
 * @return {Promise<number>} returns the clock of the flushed doc
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
