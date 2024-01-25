import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { decoding, encoding, map } from 'lib0';
import { readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import { firstValueFrom } from 'rxjs';
import { encodeStateAsUpdate } from 'yjs';
import { Buffer } from 'node:buffer';
import { Redis } from 'ioredis';
import { Logger } from '@src/core/logger';
import { applyUpdate } from 'yjs';
import { TldrawRedisFactory } from '../redis';
import {
	CloseConnectionLoggable,
	RedisPublishErrorLoggable,
	WebsocketErrorLoggable,
	WebsocketMessageErrorLoggable,
	WsSharedDocErrorLoggable,
} from '../loggable';
import { TldrawConfig } from '../config';
import { AwarenessConnectionsUpdate, RedisConnectionTypeEnum, WSConnectionState, WSMessageType } from '../types';
import { WsSharedDocDo } from '../domain';
import { TldrawBoardRepo } from '../repo';
import { MetricsService } from '../metrics';

@Injectable()
export class TldrawWsService {
	public docs = new Map();

	private readonly pingTimeout: number;

	private readonly gcEnabled: boolean;

	public readonly sub: Redis;

	private readonly pub: Redis;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawBoardRepo: TldrawBoardRepo,
		private readonly logger: Logger,
		private readonly metricsService: MetricsService,
		private readonly tldrawRedisFactory: TldrawRedisFactory
	) {
		this.logger.setContext(TldrawWsService.name);
		this.pingTimeout = this.configService.get<number>('TLDRAW_PING_TIMEOUT');
		this.gcEnabled = this.configService.get<boolean>('TLDRAW_GC_ENABLED');

		this.sub = this.tldrawRedisFactory.build(RedisConnectionTypeEnum.SUBSCRIBE);
		this.pub = this.tldrawRedisFactory.build(RedisConnectionTypeEnum.PUBLISH);
	}

	/**
	 * @param {WsSharedDocDo} doc
	 * @param {WebSocket} ws
	 */
	public async closeConn(doc: WsSharedDocDo, ws: WebSocket): Promise<void> {
		if (doc.connections.has(ws)) {
			const controlledIds = doc.connections.get(ws) as Set<number>;
			doc.connections.delete(ws);
			removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
			await this.storeStateAndDestroyYDocIfPersisted(doc);
			this.metricsService.decrementNumberOfUsersOnServerCounter();
		}

		ws.close();
	}

	/**
	 * @param {WsSharedDocDo} doc
	 * @param {WebSocket} conn
	 * @param {Uint8Array} message
	 */
	public send(doc: WsSharedDocDo, conn: WebSocket, message: Uint8Array): void {
		if (conn.readyState !== WSConnectionState.CONNECTING && conn.readyState !== WSConnectionState.OPEN) {
			this.closeConn(doc, conn).catch((err) => {
				this.logger.warning(new CloseConnectionLoggable(err));
			});
		}

		conn.send(message, (err) => {
			if (err) {
				this.closeConn(doc, conn).catch((e) => {
					this.logger.warning(new CloseConnectionLoggable(e));
				});
			}
		});
	}

	/**
	 * @param {Uint8Array} update
	 * @param {any} origin
	 * @param {WsSharedDocDo} doc
	 */
	public updateHandler(update: Uint8Array, origin, doc: WsSharedDocDo): void {
		const isOriginWSConn = doc.connections.has(origin as WebSocket);
		if (isOriginWSConn) {
			this.publishUpdateToRedis(doc, update, 'document');
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
	 */
	public getYDoc(docName: string) {
		const wsSharedDocDo = map.setIfUndefined(this.docs, docName, () => {
			const doc = new WsSharedDocDo(docName, this.gcEnabled);
			this.registerAwarenessUpdateHandler(doc);
			this.registerUpdateHandler(doc);
			this.subscribeToRedisChannels(doc);

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
					this.publishUpdateToRedis(doc, update, 'awareness');
					break;
				}
				default:
					break;
			}
		} catch (err) {
			this.logger.warning(new WebsocketMessageErrorLoggable(err));
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
	public async setupWSConnection(ws: WebSocket, docName: string) {
		ws.binaryType = 'arraybuffer';

		// get doc, initialize if it does not exist yet
		const isNew = !this.docs.has(docName);
		const doc = this.getYDoc(docName);
		doc.connections.set(ws, new Set());
		if (isNew) {
			await this.updateDocument(docName, doc);
		}

		ws.on('error', (err) => {
			this.logger.warning(new WebsocketErrorLoggable(err));
		});

		ws.on('message', (message: ArrayBufferLike) => {
			this.messageHandler(ws, doc, new Uint8Array(message));
		});

        // send initial doc state to client as update
        this.sendInitialState(ws, doc);

		// check if connection is still alive
		let pongReceived = true;
		const pingInterval = setInterval(() => {
			if (pongReceived && doc.connections.has(ws)) {
				pongReceived = false;
				ws.ping();
				return;
			}

			this.closeConn(doc, ws).catch((err) => {
				this.logger.warning(new CloseConnectionLoggable(err));
			});
			clearInterval(pingInterval);
		}, this.pingTimeout);

		ws.on('close', () => {
			this.closeConn(doc, ws).catch((err) => {
				this.logger.warning(new CloseConnectionLoggable(err));
			});
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

	private async storeStateAndDestroyYDocIfPersisted(doc: WsSharedDocDo) {
		if (doc.connections.size === 0) {
			// if persisted, we store state and destroy ydocument
			try {
				await this.tldrawBoardRepo.flushDocument(doc.name);
				this.unsubscribeFromRedisChannels(doc);
				doc.destroy();
			} catch (err) {
				this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while flushing doc', err));
				throw err;
			}

			this.docs.delete(doc.name);
			this.metricsService.decrementNumberOfBoardsOnServerCounter();
		}
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

	private registerAwarenessUpdateHandler(doc: WsSharedDocDo) {
		doc.awareness.on('update', (connectionsUpdate: AwarenessConnectionsUpdate, wsConnection: WebSocket | null) =>
			this.awarenessUpdateHandler(connectionsUpdate, wsConnection, doc)
		);
	}

	private registerUpdateHandler(doc: WsSharedDocDo) {
		doc.on('update', (update: Uint8Array, origin) => this.updateHandler(update, origin, doc));
	}

	private subscribeToRedisChannels(doc: WsSharedDocDo) {
		this.sub
			.subscribe(doc.name, doc.awarenessChannel, (err) => {
				if (err) {
					this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while subscribing to Redis channels', err));
				}
			})
			.catch((err) => {
				this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while subscribing to Redis channels', err));
			});
		this.sub.on('messageBuffer', (channel, message) => this.redisMessageHandler(channel, message, doc));
	}

	private unsubscribeFromRedisChannels(doc: WsSharedDocDo) {
		this.sub
			.unsubscribe(doc.name, doc.awarenessChannel, (err) => {
				if (err) {
					this.logger.warning(
						new WsSharedDocErrorLoggable(doc.name, 'Error while unsubscribing from Redis channels', err)
					);
				}
			})
			.catch((err) => {
				this.logger.warning(
					new WsSharedDocErrorLoggable(doc.name, 'Error while unsubscribing from Redis channels', err)
				);
			});
	}

	private async updateDocument(docName: string, doc: WsSharedDocDo) {
		try {
			await this.tldrawBoardRepo.updateDocument(docName, doc);
		} catch (err) {
			this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while updating document', err));
			throw err;
		}
	}

	private publishUpdateToRedis(doc: WsSharedDocDo, update: Uint8Array, type: 'awareness' | 'document') {
		const channel = type === 'awareness' ? doc.awarenessChannel : doc.name;
		this.pub
			.publish(channel, Buffer.from(update), (err) => {
				if (err) {
					this.logger.warning(new RedisPublishErrorLoggable('awareness', err));
				}
			})
			.catch((err) => {
				this.logger.warning(new RedisPublishErrorLoggable('awareness', err));
			});
	}

    private sendInitialState(ws: WebSocket, doc: WsSharedDocDo): void {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, WSMessageType.SYNC);
        writeUpdate(encoder, encodeStateAsUpdate(doc));
        this.send(doc, ws, encoding.toUint8Array(encoder));
    }
}
