import { setInterval, clearInterval } from 'timers';

const Y = require('yjs');
const syncProtocol = require('y-protocols/dist/sync.cjs');
const awarenessProtocol = require('y-protocols/dist/awareness.cjs');

const encoding = require('lib0/dist/encoding.cjs');
const decoding = require('lib0/dist/decoding.cjs');
const map = require('lib0/dist/map.cjs');

const debounce = require('lodash.debounce');

const callbackHandler = require('./callback').callbackHandler;
const isCallbackSet = require('./callback').isCallbackSet;

const CALLBACK_DEBOUNCE_WAIT = 2000;
const CALLBACK_DEBOUNCE_MAXWAIT = 10000;

// const wsReadyStateConnecting = 'connecting';
const wsReadyStateConnecting = 0;
// const wsReadyStateOpen = 'open';
const wsReadyStateOpen = 1;

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';
/**
 * @type {{bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence: any = null;

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
exports.setPersistence = persistence_ => {
	persistence = persistence_;
};

/**
 * @return {null|{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>}|null} used persistence layer
 */
exports.getPersistence = () => persistence;

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map();
// exporting docs so that others can use it
exports.docs = docs;

const messageSync = 0;
const messageAwareness = 1;
// const messageAuth = 2

const pingTimeout = 30000

/**
 * @param {Uint8Array} update
 * @param {any} origin
 * @param {WSSharedDoc} doc
 */
const updateHandler = (update, origin, doc) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, messageSync);
	syncProtocol.writeUpdate(encoder, update);
	const message = encoding.toUint8Array(encoder);
	doc.conns.forEach((_, conn) => send(doc, conn, message));
};

export class WSSharedDoc extends Y.Doc {
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
			encoding.writeVarUint(encoder, messageAwareness);
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
				{ maxWait: CALLBACK_DEBOUNCE_MAXWAIT }
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

exports.getYDoc = getYDoc;

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
			case messageSync:
				encoding.writeVarUint(encoder, messageSync);
				syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

				// If the `encoder` only contains the type of reply message and no
				// message, there is no need to send the message. When `encoder` only
				// contains the type of reply, its length is 1.
				if (encoding.length(encoder) > 1) {
					send(doc, conn, encoding.toUint8Array(encoder));
				}
				break;
			case messageAwareness: {
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
	// ws.server.sockets.sockets.get(ws.id)?.disconnect();
	ws.close();
};

/**
 * @param {WSSharedDoc} doc
 * @param {any} conn
 * @param {Uint8Array} message
 */
const send = (doc: WSSharedDoc, conn, message) => {
	// if (conn.client.conn.readyState !== wsReadyStateConnecting && conn.client.conn.readyState !== wsReadyStateOpen) {
	// 	closeConn(doc, conn);
	// }

	if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
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
exports.setupWSConnection = (ws, docName = 'GLOBAL') => {
	ws.binaryType = 'arraybuffer';
	var fs = require('fs');
	// get doc, initialize if it does not exist yet
	const doc = getYDoc(docName, true)
	doc.conns.set(ws, new Set())

	// listen and reply to events
	ws.on('message', message => {
		messageHandler(ws, doc, new Uint8Array(message));
	});

	// Check if connection is still alive
	let pongReceived = true
	const pingInterval = setInterval(() => {
		if (!pongReceived) {
			if (doc.conns.has(ws)) {
				closeConn(doc, ws);
			}
			clearInterval(pingInterval)
		} else if (doc.conns.has(ws)) {
			pongReceived = false;
			try {
				ws.ping()
			} catch (e) {
				closeConn(doc, ws);
				clearInterval(pingInterval);
			}
		}
	}, pingTimeout)
	ws.on('close', () => {
		closeConn(doc, ws);
		clearInterval(pingInterval);
	})
	ws.on('pong', () => {
		pongReceived = true;
	})
	{
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageSync);
		syncProtocol.writeSyncStep1(encoder, doc);
		send(doc, ws, encoding.toUint8Array(encoder));
		const awarenessStates = doc.awareness.getStates();
		if (awarenessStates.size > 0) {
			const encoder = encoding.createEncoder()
			encoding.writeVarUint(encoder, messageAwareness)
			encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
			send(doc, ws, encoding.toUint8Array(encoder))
		}
	}
};
