import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { decoding, encoding, map } from 'lib0';
import { readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Buffer } from 'node:buffer';
import { Redis } from 'ioredis';
import { Logger } from '@src/core/logger';
import { applyUpdate } from 'yjs';
import {
	RedisGeneralErrorLoggable,
	RedisPublishErrorLoggable,
	WebsocketCloseErrorLoggable,
	WebsocketMessageErrorLoggable,
	WsSharedDocErrorLoggable,
} from '../loggable';
import { TldrawConfig } from '../config';
import { AwarenessConnectionsUpdate, WSConnectionState, WSMessageType } from '../types';
import { WsSharedDocDo } from '../domain';
import { TldrawBoardRepo } from '../repo';
import { MetricsService } from '../metrics';

@Injectable()
export class TldrawWsService {
	public pingTimeout: number;

	private gcEnabled: boolean;

	public docs = new Map();

	public readonly sub: Redis;

	private readonly pub: Redis;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawBoardRepo: TldrawBoardRepo,
		private readonly logger: Logger,
		private readonly httpService: HttpService,
		private readonly metricsService: MetricsService
	) {
		this.logger.setContext(TldrawWsService.name);
		this.pingTimeout = this.configService.get<number>('TLDRAW_PING_TIMEOUT');
		this.gcEnabled = this.configService.get<boolean>('TLDRAW_GC_ENABLED');
		const redisUri: string = this.configService.get<string>('REDIS_URI');

		if (!redisUri) {
			throw new Error('REDIS_URI is not set');
		}

		// TODO może przenieść to do innego serwisu TldrawRedisService - bo można przetestować łatwiej (metoda build or sth by tworzyła te połączenia) zrobić factory i zawołać w tym serwisie
		this.sub = new Redis(redisUri, {
			maxRetriesPerRequest: null,
		});
		this.sub.on('error', (err) => this.logger.warning(new RedisGeneralErrorLoggable('SUB', err)));

		this.pub = new Redis(redisUri, {
			maxRetriesPerRequest: null,
		});
		this.pub.on('error', (err) => this.logger.warning(new RedisGeneralErrorLoggable('PUB', err)));
	}

	/**
	 * @param {WsSharedDocDo} doc
	 * @param {WebSocket} ws
	 */
	public closeConn(doc: WsSharedDocDo, ws: WebSocket): void {
		if (doc.connections.has(ws)) {
			const controlledIds = doc.connections.get(ws) as Set<number>;
			doc.connections.delete(ws);
			removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
			if (doc.connections.size === 0) {
				// if persisted, we store state and destroy ydocument
				this.tldrawBoardRepo
					.flushDocument(doc.name)
					.then(() => this.sub.unsubscribe(doc.name, doc.awarenessChannel))
					.then(() => doc.destroy())
					.catch((err) => {
						this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while flushing doc', err as Error));
						throw err;
					});
				this.docs.delete(doc.name);
				this.metricsService.decrementNumberOfBoardsOnServerCounter();
			}
			this.metricsService.decrementNumberOfUsersOnServerCounter();
		}

		try {
			ws.close();
		} catch (err) {
			this.logger.warning(
				new WebsocketCloseErrorLoggable('Error while closing websocket, it may already be closed', err as Error)
			);
			throw err;
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
		const isOriginWSConn = doc.connections.has(origin as WebSocket);
		if (isOriginWSConn) {
			this.pub.publish(doc.name, Buffer.from(update)).catch((err) => {
				this.logger.warning(new RedisPublishErrorLoggable('document', err as Error));
				throw err;
			});
		}

		this.propagateUpdate(update, doc);
	}

	/**
	 * @param {AwarenessConnectionsUpdate} connectionsUpdate
	 * @param {WebSocket | null} wsConnection Origin is the connection that made the change
	 * @param {WsSharedDocDo} doc
	 */
	public awarenessUpdateHandler = (
		connectionsUpdate: AwarenessConnectionsUpdate,
		wsConnection: WebSocket | null,
		doc: WsSharedDocDo
	): void => {
		const changedClients = this.manageClientsConnections(connectionsUpdate, wsConnection, doc);
		const buff = this.prepareAwarenessMessage(changedClients, doc);
		this.sendAwarenessMessage(buff, doc);
	};

	/**
	 * Gets a Y.Doc by name, whether in memory or on disk
	 *
	 * @param {string} docName - the name of the Y.Doc to find or create
	 * @return {WsSharedDocDo}
	 */
	public getYDoc(docName: string): WsSharedDocDo {
		const wsSharedDocDo = map.setIfUndefined(this.docs, docName, () => {
			const doc = new WsSharedDocDo(docName, this.gcEnabled);
			doc.awareness.on('update', (connectionsUpdate: AwarenessConnectionsUpdate, wsConnection: WebSocket | null) =>
				this.awarenessUpdateHandler(connectionsUpdate, wsConnection, doc)
			);
			doc.on('update', (update: Uint8Array, origin) => this.updateHandler(update, origin, doc));

			this.sub // TODO przenieść do nowego serwisu
				.subscribe(doc.name, doc.awarenessChannel)
				.then(() => this.sub.on('messageBuffer', (channel, message) => this.redisMessageHandler(channel, message, doc)))
				.catch((err) => {
					this.logger.warning(
						new WsSharedDocErrorLoggable(doc.name, 'Error while subscribing to Redis channels', err as Error)
					);
					throw err;
				});

			this.tldrawBoardRepo.updateDocument(docName, doc).catch((err) => {
				this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while updating document', err as Error));
				throw err;
			});

			this.docs.set(docName, doc);
			this.metricsService.incrementNumberOfBoardsOnServerCounter();
			return doc;
		});

		return wsSharedDocDo;
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
					this.pub.publish(doc.awarenessChannel, Buffer.from(update)).catch((err) => {
						this.logger.warning(new RedisPublishErrorLoggable('awareness', err as Error));
						throw err;
					});
					applyAwarenessUpdate(doc.awareness, update, conn);
					break;
				}
				default:
					break;
			}
		} catch (err) {
			this.logger.warning(new WebsocketMessageErrorLoggable(err as Error));
			throw err;
		}
	}

	/**
	 * @param {{ Buffer }} channel redis channel
	 * @param {{ Buffer }} update update message
	 * @param {{ WsSharedDocDo }} doc ydoc
	 */
	public redisMessageHandler = (channel: Buffer, update: Buffer, doc: WsSharedDocDo): void => {
		const channelId = channel.toString();

		if (channelId === doc.name) {
			applyUpdate(doc, update, this.sub);
		}

		if (channelId === doc.awarenessChannel) {
			applyAwarenessUpdate(doc.awareness, update, this.sub);
		}
	};

	/**
	 * @param {WebSocket} ws
	 * @param {string} docName
	 */
	public setupWSConnection(ws: WebSocket, docName: string): void {
		ws.binaryType = 'arraybuffer';
		// get doc, initialize if it does not exist yet
		const doc = this.getYDoc(docName);
		doc.connections.set(ws, new Set());

		// listen and reply to events
		ws.on('message', (message: ArrayBufferLike) => {
			this.messageHandler(ws, doc, new Uint8Array(message));
		});

		// Check if connection is still alive
		let pongReceived = true;
		const pingInterval = setInterval(() => {
			const hasConn = doc.connections.has(ws);

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
		this.metricsService.incrementNumberOfUsersOnServerCounter();
	}

	private propagateUpdate(update: Uint8Array, doc: WsSharedDocDo): void {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		writeUpdate(encoder, update);
		const message = encoding.toUint8Array(encoder);
		doc.connections.forEach((_, conn) => {
			this.send(doc, conn, message);
		});
	}

	/**
	 * @param changedClients array of changed clients
	 * @param {WsSharedDocDo} doc
	 */
	private prepareAwarenessMessage(changedClients: number[], doc: WsSharedDocDo): Uint8Array {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
		encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(doc.awareness, changedClients));
		const message = encoding.toUint8Array(encoder);
		return message;
	}

	/**
	 * @param {{ Uint8Array }} buff encoded message about changes
	 * @param {WsSharedDocDo} doc
	 */
	private sendAwarenessMessage(buff: Uint8Array, doc: WsSharedDocDo): void {
		doc.connections.forEach((_, c) => {
			this.send(doc, c, buff);
		});
	}

	/**
	 * @param connectionsUpdate
	 * @param {WebSocket | null} wsConnection Origin is the connection that made the change
	 * @param {WsSharedDocDo} doc
	 */
	private manageClientsConnections(
		connectionsUpdate: AwarenessConnectionsUpdate,
		wsConnection: WebSocket | null,
		doc: WsSharedDocDo
	): number[] {
		const changedClients = connectionsUpdate.added.concat(connectionsUpdate.updated, connectionsUpdate.removed);
		if (wsConnection !== null) {
			const connControlledIDs = doc.connections.get(wsConnection);
			if (connControlledIDs !== undefined) {
				connectionsUpdate.added.forEach((clientID) => {
					connControlledIDs.add(clientID);
				});
				connectionsUpdate.removed.forEach((clientID) => {
					connControlledIDs.delete(clientID);
				});
			}
		}
		return changedClients;
	}

	public async authorizeConnection(drawingName: string, token: string) {
		if (!token) {
			throw new UnauthorizedException('Token was not given');
		}
		const headers = {
			Accept: 'Application/json',
			Authorization: `Bearer ${token}`,
		};

		await firstValueFrom(
			this.httpService.get(`${this.configService.get<string>('API_HOST')}/v3/elements/${drawingName}/permission`, {
				headers,
			})
		);
	}
}
