import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@src/modules/tldraw/config';
import { Persitence, WSConnectionState, WSMessageType, WsSharedDocDo } from '@src/modules/tldraw/types';
import WebSocket from 'ws';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { encoding, decoding, map } from 'lib0';
import { readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import { TldrawBoardRepo } from '@src/modules/tldraw/repo';

@Injectable()
export class TldrawWsService {
	pingTimeout: number;

	persistence: Persitence | null = null;

	docs = new Map();

	constructor(
		readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawBoardRepo: TldrawBoardRepo
	) {
		this.pingTimeout = this.configService.get<number>('TLDRAW_PING_TIMEOUT') ?? 10000;
	}

	setPersistence(persistence_: Persitence) {
		this.persistence = persistence_;
	}

	/**
	 * @param {WsSharedDocDo} doc
	 * @param {WebSocket} ws
	 */
	closeConn(doc: WsSharedDocDo, ws: WebSocket) {
		if (doc.conns.has(ws)) {
			const controlledIds = doc.conns.get(ws) as Set<number>;
			doc.conns.delete(ws);
			removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
			if (doc.conns.size === 0 && this.persistence !== null) {
				// if persisted, we store state and destroy ydocument
				this.persistence
					.writeState(doc.name, doc)
					.then(() => {
						doc.destroy();
						return null;
					})
					.catch(() => {});
				this.docs.delete(doc.name);
			}
		}

		try {
			ws.close();
		} catch (err) {
			throw new Error('Cannot close the connection. It is possible that connection is already closed.');
		}
	}

	/**
	 * @param {WsSharedDocDo} doc
	 * @param {WebSocket} conn
	 * @param {Uint8Array} message
	 */
	send(doc: WsSharedDocDo, conn: WebSocket, message: Uint8Array) {
		if (conn.readyState !== WSConnectionState.CONNECTING && conn.readyState !== WSConnectionState.OPEN) {
			this.closeConn(doc, conn);
		}
		try {
			conn.send(message, (err: Error | undefined) => {
				if (err != null) {
					this.closeConn(doc, conn);
				}
			});
		} catch (e) {
			this.closeConn(doc, conn);
		}
	}

	/**
	 * @param {Uint8Array} update
	 * @param {any} origin
	 * @param {WsSharedDocDo} doc
	 */
	updateHandler(update: Uint8Array, origin, doc: WsSharedDocDo) {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		writeUpdate(encoder, update);
		const message = encoding.toUint8Array(encoder);
		doc.conns.forEach((_, conn) => {
			this.send(doc, conn, message);
		});
	}

	/**
	 * Gets a Y.Doc by name, whether in memory or on disk
	 *
	 * @param {string} docname - the name of the Y.Doc to find or create
	 * @param  {boolean} gc - whether to allow gc on the doc (applies only when created)
	 * @return {WsSharedDocDo}
	 */
	getYDoc(docname: string, gc = true) {
		return map.setIfUndefined(this.docs, docname, () => {
			const doc = new WsSharedDocDo(docname, this, gc);
			if (this.persistence !== null) {
				this.persistence.bindState(docname, doc).catch(() => {});
			}
			this.docs.set(docname, doc);
			return doc;
		});
	}

	messageHandler(conn: WebSocket, doc: WsSharedDocDo, message: Uint8Array) {
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
						this.send(doc, conn, encoding.toUint8Array(encoder));
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
	}

	/**
	 * @param {WebSocket} ws
	 * @param {string} docName
	 */
	setupWSConnection(ws: WebSocket, docName = 'GLOBAL') {
		ws.binaryType = 'arraybuffer';
		// get doc, initialize if it does not exist yet
		const doc = this.getYDoc(docName, true);
		doc.conns.set(ws, new Set());

		// listen and reply to events
		ws.on('message', (message: ArrayBufferLike) => {
			this.messageHandler(ws, doc, new Uint8Array(message));
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
					this.closeConn(doc, ws);
					clearInterval(pingInterval);
				}
				return;
			}

			if (hasConn) {
				this.closeConn(doc, ws);
			}

			clearInterval(pingInterval);
		}, this.pingTimeout);
		ws.on('close', () => {
			this.closeConn(doc, ws);
			clearInterval(pingInterval);
		});
		ws.on('pong', () => {
			pongReceived = true;
		});
		{
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, WSMessageType.SYNC);
			writeSyncStep1(encoder, doc);
			this.send(doc, ws, encoding.toUint8Array(encoder));
			const awarenessStates = doc.awareness.getStates();
			if (awarenessStates.size > 0) {
				encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
				encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())));
				this.send(doc, ws, encoding.toUint8Array(encoder));
			}
		}
	}

	async updateDocument(docName: string, ydoc: WsSharedDocDo) {
		await this.tldrawBoardRepo.updateDocument(docName, ydoc);
	}

	async flushDocument(docName: string) {
		await this.tldrawBoardRepo.flushDocument(docName);
	}
}
