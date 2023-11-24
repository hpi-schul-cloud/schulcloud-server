import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@src/modules/tldraw/config';
import { WSConnectionState, WSMessageType, WsSharedDocDo } from '@src/modules/tldraw/types';
import WebSocket from 'ws';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { encoding, decoding, map } from 'lib0';
import { readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import { TldrawBoardRepo } from '@src/modules/tldraw/repo';
import { Buffer } from 'node:buffer';
import { Redis } from 'ioredis';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class TldrawWsService {
	public pingTimeout: number;

	public docs = new Map();

	public readonly sub: Redis;

	private readonly pub: Redis;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawBoardRepo: TldrawBoardRepo,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(TldrawWsService.name);
		this.pingTimeout = this.configService.get<number>('TLDRAW_PING_TIMEOUT');
		const redisUrl: string = this.configService.get<string>('REDIS_URI');

		this.sub = new Redis(redisUrl, {
			maxRetriesPerRequest: null,
		});
		this.sub.on('error', (err) => this.logger.error('Redis SUB error', err));

		this.pub = new Redis(redisUrl, {
			maxRetriesPerRequest: null,
		});
		this.pub.on('error', (err) => this.logger.error('Redis PUB error', err));
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
			if (doc.conns.size === 0) {
				// if persisted, we store state and destroy ydocument
				this.tldrawBoardRepo
					.flushDocument(doc.name)
					.then(() => {
						doc.destroy();
						return null;
					})
					.catch((err) => this.logger.error(err));
				this.docs.delete(doc.name);
			}
		}

		try {
			ws.close();
		} catch (err) {
			this.logger.error('Could not close the connection - it may already be closed');
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
		const isOriginWSConn = doc.conns.has(origin as WebSocket);
		if (isOriginWSConn) {
			this.pub.publish(doc.name, Buffer.from(update)).catch((err) => this.logger.error(err));
		}

		this.propagateUpdate(update, doc);
	}

	/**
	 * Gets a Y.Doc by name, whether in memory or on disk
	 *
	 * @param {string} docName - the name of the Y.Doc to find or create
	 * @param  {boolean} gc - whether to allow gc on the doc (applies only when created)
	 * @return {WsSharedDocDo}
	 */
	public getYDoc(docName: string, gc = true): WsSharedDocDo {
		return map.setIfUndefined(this.docs, docName, () => {
			const doc = new WsSharedDocDo(docName, this, gc);

			this.tldrawBoardRepo.updateDocument(docName, doc).catch((err) => this.logger.error(err));
			this.docs.set(docName, doc);
			return doc;
		});
	}

	public async createDbIndex(): Promise<void> {
		await this.tldrawBoardRepo.createDbIndex();
	}

	public messageHandler(conn: WebSocket, doc: WsSharedDocDo, message: Uint8Array): void {
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
					this.pub.publish(doc.awarenessChannel, Buffer.from(update)).catch((err) => this.logger.error(err));
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
	public setupWSConnection(ws: WebSocket, docName = 'GLOBAL'): void {
		ws.binaryType = 'arraybuffer';
		// get doc, initialize if it does not exist yet
		const doc = this.getYDoc(docName, true);
		doc.conns.set(ws, new Set());

		// listen and reply to events
		ws.on('message', (message: ArrayBufferLike) => {
			void this.messageHandler(ws, doc, new Uint8Array(message));
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
			const syncEncoder = encoding.createEncoder();
			encoding.writeVarUint(syncEncoder, WSMessageType.SYNC);
			writeSyncStep1(syncEncoder, doc);
			this.send(doc, ws, encoding.toUint8Array(syncEncoder));
			const awarenessStates = doc.awareness.getStates();
			if (awarenessStates.size > 0) {
				const awarenessEncoder = encoding.createEncoder();
				encoding.writeVarUint(awarenessEncoder, WSMessageType.AWARENESS);
				encoding.writeVarUint8Array(
					awarenessEncoder,
					encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
				);
				this.send(doc, ws, encoding.toUint8Array(awarenessEncoder));
			}
		}
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
