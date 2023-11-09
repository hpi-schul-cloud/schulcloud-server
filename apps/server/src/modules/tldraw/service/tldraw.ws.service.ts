import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@src/modules/tldraw/config';
import { Persitence, WSConnectionState, WSMessageType, WsSharedDocDo } from '@src/modules/tldraw/types';
import WebSocket from 'ws';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { encoding, decoding, map } from 'lib0';
import { readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import { TldrawBoardRepo } from '@src/modules/tldraw/repo';
import * as mutex from 'lib0/mutex';
import Redis from 'ioredis';
import { Buffer } from 'node:buffer';
import { getDocUpdatesFromQueue, pushDocUpdatesToQueue } from '@modules/tldraw/redis';
import { applyUpdate, Doc } from 'yjs';

@Injectable()
export class TldrawWsService {
	public pingTimeout: number;

	public persistence: Persitence | null = null;

	public docs = new Map();

	private mux: mutex.mutex;

	private readonly redisUri: string;

	private pub: Redis.Redis;

	sub: Redis.Redis;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawBoardRepo: TldrawBoardRepo
	) {
		this.pingTimeout = this.configService.get<number>('TLDRAW_PING_TIMEOUT');
		this.redisUri = this.configService.get<string>('REDIS_URI');
		this.mux = mutex.createMutex();
		this.pub = new Redis(this.redisUri);
		this.sub = new Redis(this.redisUri);
	}

	public setPersistence(persistence_: Persitence): void {
		this.persistence = persistence_;
	}

	/**
	 * @param {WsSharedDocDo} doc
	 * @param {WebSocket} ws
	 */
	public closeConn(doc: WsSharedDocDo, ws: WebSocket): void {
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
	public send(doc: WsSharedDocDo, conn: WebSocket, message: Uint8Array): void {
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
	public updateHandler(update: Uint8Array, origin, doc: WsSharedDocDo): void {
		const isOriginWSConn = origin instanceof WebSocket && doc.conns.has(origin);

		if (isOriginWSConn) {
			void Promise.all([
				this.pub.publishBuffer(doc.name, Buffer.from(update)),
				pushDocUpdatesToQueue(this.pub, doc, update),
			]);

			this.propagateUpdate(update, doc);
		} else {
			this.propagateUpdate(update, doc);
		}
	}

	/**
	 * Gets a Y.Doc by name, whether in memory or on disk
	 *
	 * @param {string} docName - the name of the Y.Doc to find or create
	 * @param  {boolean} gc - whether to allow gc on the doc (applies only when created)
	 * @return {WsSharedDocDo}
	 */
	getYDoc(docName: string, gc = true): WsSharedDocDo {
		return map.setIfUndefined(this.docs, docName, () => {
			const doc = new WsSharedDocDo(docName, this, gc);
			if (this.persistence !== null) {
				this.persistence.bindState(docName, doc).catch(() => {});
			}
			this.docs.set(docName, doc);
			return doc;
		});
	}

	public async messageHandler(conn: WebSocket, doc: WsSharedDocDo, message: Uint8Array): Promise<void> {
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
					const update = decoding.readVarUint8Array(decoder);
					await this.pub.publishBuffer(doc.awarenessChannel, Buffer.from(update));
					applyAwarenessUpdate(doc.awareness, update, conn);
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
	public async setupWSConnection(ws: WebSocket, docName = 'GLOBAL'): Promise<void> {
		ws.binaryType = 'arraybuffer';
		// get doc, initialize if it does not exist yet
		const doc = this.getYDoc(docName, true);
		doc.conns.set(ws, new Set());

		// listen and reply to events
		ws.on('message', (message: ArrayBufferLike) => {
			void this.messageHandler(ws, doc, new Uint8Array(message));
		});

		const redisUpdates = await getDocUpdatesFromQueue(this.sub, doc);
		const redisYDoc = new Doc();
		redisYDoc.transact(() => {
			for (const u of redisUpdates) {
				applyUpdate(redisYDoc, u);
			}
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

	public async updateDocument(docName: string, ydoc: WsSharedDocDo): Promise<void> {
		await this.tldrawBoardRepo.updateDocument(docName, ydoc);
	}

	public async flushDocument(docName: string): Promise<void> {
		await this.tldrawBoardRepo.flushDocument(docName);
	}

	private propagateUpdate(update: Uint8Array, doc: WsSharedDocDo): void {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		writeUpdate(encoder, update);
		const message = encoding.toUint8Array(encoder);
		doc.conns.forEach((_, conn) => {
			this.send(doc, conn, message);
		});
	}
}
