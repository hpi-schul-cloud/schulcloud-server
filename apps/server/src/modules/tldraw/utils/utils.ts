import { setInterval, clearInterval } from 'timers';
import * as Y from "yjs";
import * as map from "lib0/dist/map.cjs";
import * as awarenessProtocol from "y-protocols/dist/awareness.cjs";
import * as encoding from "lib0/dist/encoding.cjs";
import * as decoding from "lib0/dist/decoding.cjs";
import * as syncProtocol from "y-protocols/dist/sync.cjs";
import { isCallbackSet, callbackHandler } from "./callback";
import * as debounce from "lodash.debounce";
import { Configuration } from '@hpi-schul-cloud/commons';

const CALLBACK_DEBOUNCE_WAIT = Configuration.get('FEATURE_TLDRAW_CALLBACK_DEBOUNCE_WAIT') as number ?? 2000;
const CALLBACK_DEBOUNCE_MAX_WAIT = Configuration.get('FEATURE_TLDRAW_CALLBACK_DEBOUNCE_MAX_WAIT') as number ?? 10000;
const pingTimeout = Configuration.get('FEATURE_TLDRAW_PING_TIMEOUT') as number ?? 30000;
// disable gc when using snapshots!
const gcEnabled = Configuration.get('FEATURE_TLDRAW_GC_ENABLED');

enum wsStatesEnum {
	wsReadyStateConnecting = 0,
	wsReadyStateOpen = 1
}

enum wsMessageTypes {
	messageSync = 0,
	messageAwareness = 1
}

/**
 * @type {{bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence: any = null;

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
export const setPersistence = persistence_ => {
	persistence = persistence_;
};

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map();

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
const updateHandler = (update, origin, doc) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, wsMessageTypes.messageSync);
	syncProtocol.writeUpdate(encoder, update);
	const message = encoding.toUint8Array(encoder);
	doc.conns.forEach((_, conn) => send(doc, conn, message));
};

export class WSSharedDoc extends Y.Doc {
	private name: any;
	conns: Map<string, any>;
	private awareness: awarenessProtocol.Awareness;
	/**
	 * @param {string} name
	 */
	constructor(name) {
		super({ gc: gcEnabled });
		this.name = name;
		this.conns = new Map();
		this.awareness = new awarenessProtocol.Awareness(this);
		this.awareness.setLocalState(null);

		/**
		 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
		 * @param {Object | null} conn Origin is the connection that made the change
		 */
		const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
			const changedClients = added.concat(updated, removed);
			if (conn !== null) {
				const connControlledIDs = (this.conns.get(conn));
				if (connControlledIDs !== undefined) {
					added.forEach(clientID => {
						connControlledIDs.add(clientID);
					});
					removed.forEach(clientID => {
						connControlledIDs.delete(clientID);
					});
				}
			}
			// broadcast awareness update
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, wsMessageTypes.messageAwareness);
			encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients));
			const buff = encoding.toUint8Array(encoder);
			this.conns.forEach((_, c) => {
				send(this, c, buff);
			});
		};
		this.awareness.on('update', awarenessChangeHandler);
		this.on('update', updateHandler);
		if (isCallbackSet) {
			this.on('update', debounce(
				callbackHandler,
				CALLBACK_DEBOUNCE_WAIT,
				{ maxWait: CALLBACK_DEBOUNCE_MAX_WAIT }
			));
		}
	}
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param  gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
export const getYDoc = (docname, gc = true) => map.setIfUndefined(docs, docname, () => {
	const doc = new WSSharedDoc(docname);
	doc.gc = gc;
	if (persistence !== null) {
		persistence.bindState(docname, doc);
	}
	docs.set(docname, doc);
	return doc;
});

/**
 * @param {any} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
export const messageHandler = (conn, doc, message) => {
	try {
		const encoder = encoding.createEncoder();
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);
		switch (messageType) {
			case wsMessageTypes.messageSync:
				encoding.writeVarUint(encoder, wsMessageTypes.messageSync);
				syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

				// If the `encoder` only contains the type of reply message and no
				// message, there is no need to send the message. When `encoder` only
				// contains the type of reply, its length is 1.
				if (encoding.length(encoder) > 1) {
					send(doc, conn, encoding.toUint8Array(encoder));
				}
				break;
			case wsMessageTypes.messageAwareness: {
				awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn);
				break;
			}
		}
	} catch (err) {
		console.error(err);
		doc.emit('error', [err]);
	}
};

/**
 * @param {WSSharedDoc} doc
 * @param {any} ws
 */
export const closeConn = (doc, ws) => {
	if (doc.conns.has(ws)) {
		const controlledIds = doc.conns.get(ws);
		doc.conns.delete(ws);
		awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
		if (doc.conns.size === 0 && persistence !== null) {
			// if persisted, we store state and destroy ydocument
			persistence.writeState(doc.name, doc).then(() => {
				doc.destroy();
			});
			docs.delete(doc.name);
		}
	}
	ws.close();
};

/**
 * @param {WSSharedDoc} doc
 * @param {any} conn
 * @param {Uint8Array} message
 */
export const send = (doc: WSSharedDoc, conn, message) => {
	if (conn.readyState !== wsStatesEnum.wsReadyStateConnecting && conn.readyState !== wsStatesEnum.wsReadyStateOpen) {
		closeConn(doc, conn);
	}
	try {
		conn.send(message, /** @param {any} err */err => {
			err != null && closeConn(doc, conn);
		});
	} catch (e) {
		closeConn(doc, conn);
	}
};

/**
 * @param {any} ws
 * @param {string} docName
 */
export const setupWSConnection = (ws, docName = 'GLOBAL') => {
	ws.binaryType = 'arraybuffer';
	// get doc, initialize if it does not exist yet
	const doc = getYDoc(docName, true);
	doc.conns.set(ws, new Set());

	// listen and reply to events
	ws.on('message', message => {
		messageHandler(ws, doc, new Uint8Array(message));
	});

	// Check if connection is still alive
	let pongReceived = true;
	const pingInterval = setInterval(() => {
		if (!pongReceived) {
			if (doc.conns.has(ws)) {
				closeConn(doc, ws);
			}
			clearInterval(pingInterval)
		} else if (doc.conns.has(ws)) {
			pongReceived = false;
			try {
				ws.ping();
			} catch (e) {
				closeConn(doc, ws);
				clearInterval(pingInterval);
			}
		}
	}, pingTimeout);
	ws.on('close', () => {
		closeConn(doc, ws);
		clearInterval(pingInterval);
	})
	ws.on('pong', () => {
		pongReceived = true;
	})
	{
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, wsMessageTypes.messageSync);
		syncProtocol.writeSyncStep1(encoder, doc);
	 	send(doc, ws, encoding.toUint8Array(encoder));
		const awarenessStates = doc.awareness.getStates();
		if (awarenessStates.size > 0) {
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, wsMessageTypes.messageAwareness);
			encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
			send(doc, ws, encoding.toUint8Array(encoder));
		}
	}
};
