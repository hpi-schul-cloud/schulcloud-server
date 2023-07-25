import { setInterval, clearInterval } from 'timers';
import { Doc } from 'yjs';
import { Awareness, encodeAwarenessUpdate, removeAwarenessStates, applyAwarenessUpdate } from 'y-protocols/awareness';
import { encoding, decoding, map } from 'lib0';
import { writeUpdate, readSyncMessage, writeSyncStep1 } from 'y-protocols/sync';
import { Configuration } from '@hpi-schul-cloud/commons';
import WebSocket from 'ws';
import { WSMessageType, WSConnectionState, Persitence } from '@src/modules/tldraw/types';

const pingTimeout: number = (Configuration.get('TLDRAW_PING_TIMEOUT') as number) ?? 30000;
// disable gc when using snapshots!
const gcEnabled: boolean = Configuration.get('TLDRAW_GC_ENABLED') as boolean;

/**
 * @type {{bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence: Persitence | null = null;

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
export const setPersistence = (persistence_: Persitence) => {
	persistence = persistence_;
};

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map();

/**
 * @param {WSSharedDoc} doc
 * @param {any} ws
 */
const closeConn = (doc: WSSharedDoc, ws: WebSocket) => {
	if (doc.conns.has(ws)) {
		const controlledIds = doc.conns.get(ws) as Set<number>;
		doc.conns.delete(ws);
		removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
		if (doc.conns.size === 0 && persistence !== null) {
			// if persisted, we store state and destroy ydocument
			void persistence.writeState(doc.name, doc).then(() => {
				doc.destroy();
				return null;
			});
			docs.delete(doc.name);
		}
	}
	ws.close();
};

/**
 * @param {WSSharedDoc} doc
 * @param {WebSocket} conn
 * @param {Uint8Array} message
 */
const send = (doc: WSSharedDoc, conn: WebSocket, message: Uint8Array) => {
	if (conn.readyState !== WSConnectionState.CONNECTING && conn.readyState !== WSConnectionState.OPEN) {
		closeConn(doc, conn);
	}
	try {
		conn.send(message, (err: Error | undefined) => {
			if (err != null) {
				closeConn(doc, conn);
			}
		});
	} catch (e) {
		closeConn(doc, conn);
	}
};

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
const updateHandler = (update: Uint8Array, origin, doc: WSSharedDoc) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, WSMessageType.SYNC);
	writeUpdate(encoder, update);
	const message = encoding.toUint8Array(encoder);
	doc.conns.forEach((_, conn) => send(doc, conn, message));
};

export class WSSharedDoc extends Doc {
	name: string;

	conns: Map<WebSocket, Set<number>>;

	awareness: Awareness;

	/**
	 * @param {string} name
	 */
	constructor(name: string) {
		super({ gc: gcEnabled });
		this.name = name;
		this.conns = new Map();
		this.awareness = new Awareness(this);
		this.awareness.setLocalState(null);

		this.awareness.on('update', this.awarenessChangeHandler);
		this.on('update', updateHandler);
	}

	/**
	 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
	 * @param {WebSocket | null} conn Origin is the connection that made the change
	 */
	awarenessChangeHandler = (
		{ added, updated, removed }: { added: Array<number>; updated: Array<number>; removed: Array<number> },
		conn: WebSocket | null
	) => {
		const changedClients = added.concat(updated, removed);
		if (conn !== null) {
			const connControlledIDs = this.conns.get(conn) as Set<number>;
			if (connControlledIDs !== undefined) {
				added.forEach((clientID) => {
					connControlledIDs.add(clientID);
				});
				removed.forEach((clientID) => {
					connControlledIDs.delete(clientID);
				});
			}
		}
		// broadcast awareness update
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
		encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(this.awareness, changedClients));
		const buff = encoding.toUint8Array(encoder);
		this.conns.forEach((_, c) => {
			send(this, c, buff);
		});
	};
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param  gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
const getYDoc = (docname: string, gc = true) =>
	map.setIfUndefined(docs, docname, () => {
		const doc = new WSSharedDoc(docname);
		doc.gc = gc;
		if (persistence !== null) {
			void persistence.bindState(docname, doc);
		}
		docs.set(docname, doc);
		return doc;
	});

/**
 * @param {WebSocket} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
export const messageHandler = (conn: WebSocket, doc: WSSharedDoc, message: Uint8Array) => {
	try {
		const encoder = encoding.createEncoder();
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);
		switch (messageType) {
			case WSMessageType.SYNC:
				encoding.writeVarUint(encoder, WSMessageType.SYNC);
				readSyncMessage(decoder, encoder, doc, conn);

				// If the `encoder` only contains the type of reply message and no
				// message, there is no need to send the message. When `encoder` only
				// contains the type of reply, its length is 1.
				if (encoding.length(encoder) > 1) {
					send(doc, conn, encoding.toUint8Array(encoder));
				}
				break;
			case WSMessageType.AWARENESS: {
				applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn);
				break;
			}
			default:
				break;
		}
	} catch (err) {
		doc.emit('error', [err]);
	}
};

/**
 * @param {WebSocket} ws
 * @param {string} docName
 */
export const setupWSConnection = (ws: WebSocket, docName = 'GLOBAL') => {
	ws.binaryType = 'arraybuffer';
	// get doc, initialize if it does not exist yet
	const doc = getYDoc(docName, true);
	doc.conns.set(ws, new Set());

	// listen and reply to events
	ws.on('message', (message: ArrayBufferLike) => {
		messageHandler(ws, doc, new Uint8Array(message));
	});

	// Check if connection is still alive
	let pongReceived = true;
	const pingInterval = setInterval(() => {
		const hasConn = doc.conns.has(ws);

		if (pongReceived) {
			if (!hasConn) return;
			pongReceived = false;

			try {
				ws.ping();
			} catch (e) {
				closeConn(doc, ws);
				clearInterval(pingInterval);
			}
			return;
		}

		if (hasConn) {
			closeConn(doc, ws);
		}

		clearInterval(pingInterval);
	}, pingTimeout);
	ws.on('close', () => {
		closeConn(doc, ws);
		clearInterval(pingInterval);
	});
	ws.on('pong', () => {
		pongReceived = true;
	});
	{
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		writeSyncStep1(encoder, doc);
		send(doc, ws, encoding.toUint8Array(encoder));
		const awarenessStates = doc.awareness.getStates();
		if (awarenessStates.size > 0) {
			encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
			encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
			send(doc, ws, encoding.toUint8Array(encoder));
		}
	}
};
