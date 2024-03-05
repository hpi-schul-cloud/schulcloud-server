import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates } from 'y-protocols/awareness';
import { decoding, encoding } from 'lib0';
import { readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import { applyUpdate, encodeStateAsUpdate } from 'yjs';
import { Buffer } from 'node:buffer';
import { Redis } from 'ioredis';
import { Logger } from '@src/core/logger';
import { YMap } from 'yjs/dist/src/types/YMap';
import { TldrawRedisFactory } from '../redis';
import {
	CloseConnectionLoggable,
	FileStorageErrorLoggable,
	RedisPublishErrorLoggable,
	WebsocketErrorLoggable,
	WebsocketMessageErrorLoggable,
	WsSharedDocErrorLoggable,
} from '../loggable';
import { TldrawConfig } from '../config';
import {
	AwarenessConnectionsUpdate,
	RedisConnectionTypeEnum,
	TldrawAsset,
	TldrawShape,
	UpdateOrigin,
	UpdateType,
	WSMessageType,
} from '../types';
import { WsSharedDocDo } from '../domain';
import { TldrawBoardRepo } from '../repo';
import { MetricsService } from '../metrics';
import { TldrawFilesStorageAdapterService } from './tldraw-files-storage.service';

@Injectable()
export class TldrawWsService {
	public docs = new Map<string, WsSharedDocDo>();

	public readonly sub: Redis;

	private readonly pub: Redis;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawBoardRepo: TldrawBoardRepo,
		private readonly logger: Logger,
		private readonly metricsService: MetricsService,
		private readonly tldrawRedisFactory: TldrawRedisFactory,
		private readonly filesStorageTldrawAdapterService: TldrawFilesStorageAdapterService
	) {
		this.logger.setContext(TldrawWsService.name);

		this.sub = this.tldrawRedisFactory.build(RedisConnectionTypeEnum.SUBSCRIBE);
		this.pub = this.tldrawRedisFactory.build(RedisConnectionTypeEnum.PUBLISH);

		this.sub.on('messageBuffer', (channel, message) => this.redisMessageHandler(channel, message));
	}

	public async closeConnection(doc: WsSharedDocDo, ws: WebSocket): Promise<void> {
		if (doc.connections.has(ws)) {
			const controlledIds = doc.connections.get(ws);
			doc.connections.delete(ws);
			removeAwarenessStates(doc.awareness, this.forceToArray(controlledIds), null);

			await this.finalizeIfNoConnections(doc);
			this.metricsService.decrementNumberOfUsersOnServerCounter();
		}

		ws.close();
	}

	public send(doc: WsSharedDocDo, ws: WebSocket, message: Uint8Array): void {
		if (this.isClosedOrClosing(ws)) {
			this.closeConnection(doc, ws).catch((err) => {
				this.logger.warning(new CloseConnectionLoggable('send | isClosedOrClosing', err));
			});
		}

		ws.send(message, (err) => {
			if (err) {
				this.closeConnection(doc, ws).catch((e) => {
					this.logger.warning(new CloseConnectionLoggable('send', e));
				});
			}
		});
	}

	public updateHandler(update: Uint8Array, origin, doc: WsSharedDocDo): void {
		if (this.isFromConnectedWebSocket(doc, origin)) {
			this.publishUpdateToRedis(doc, update, UpdateType.DOCUMENT);
		}

		this.sendUpdateToConnectedClients(update, doc);
	}

	public async databaseUpdateHandler(docName: string, update: Uint8Array, origin) {
		if (this.isFromRedis(origin)) {
			return;
		}
		await this.tldrawBoardRepo.storeUpdate(docName, update);
	}

	public awarenessUpdateHandler = (
		connectionsUpdate: AwarenessConnectionsUpdate,
		wsConnection: WebSocket | null,
		doc: WsSharedDocDo
	): void => {
		const changedClients = this.manageClientsConnections(connectionsUpdate, wsConnection, doc);
		const buff = this.prepareAwarenessMessage(changedClients, doc);
		this.sendAwarenessMessage(buff, doc);
	};

	public async getDocument(docName: string) {
		const existingDoc = this.docs.get(docName);
		if (existingDoc) {
			return existingDoc;
		}

		const doc = await this.tldrawBoardRepo.getDocumentFromDb(docName);

		this.registerAwarenessUpdateHandler(doc);
		this.registerUpdateHandler(doc);
		this.subscribeToRedisChannels(doc);
		this.registerDatabaseUpdateHandler(doc);

		this.docs.set(docName, doc);
		this.metricsService.incrementNumberOfBoardsOnServerCounter();
		return doc;
	}

	public async createDbIndex(): Promise<void> {
		await this.tldrawBoardRepo.createDbIndex();
	}

	public messageHandler(ws: WebSocket, doc: WsSharedDocDo, message: Uint8Array): void {
		const encoder = encoding.createEncoder();
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);
		switch (messageType) {
			case WSMessageType.SYNC:
				this.handleSyncMessage(doc, encoder, decoder, ws);
				break;
			case WSMessageType.AWARENESS: {
				this.handleAwarenessMessage(doc, decoder);
				break;
			}
			default:
				break;
		}
	}

	private handleSyncMessage(
		doc: WsSharedDocDo,
		encoder: encoding.Encoder,
		decoder: decoding.Decoder,
		ws: WebSocket
	): void {
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		readSyncMessage(decoder, encoder, doc, ws);

		// If the `encoder` only contains the type of reply message and no
		// message, there is no need to send the message. When `encoder` only
		// contains the type of reply, its length is 1.
		if (encoding.length(encoder) > 1) {
			this.send(doc, ws, encoding.toUint8Array(encoder));
		}
	}

	private handleAwarenessMessage(doc: WsSharedDocDo, decoder: decoding.Decoder) {
		const update = decoding.readVarUint8Array(decoder);
		this.publishUpdateToRedis(doc, update, UpdateType.AWARENESS);
	}

	public redisMessageHandler = (channel: Buffer, update: Buffer): void => {
		const channelId = channel.toString();
		const docName = channel.toString().split('-')[0];
		const doc = this.docs.get(docName);
		if (!doc) {
			return;
		}

		if (channelId.includes(UpdateType.AWARENESS)) {
			applyAwarenessUpdate(doc.awareness, update, UpdateOrigin.REDIS);
		} else {
			applyUpdate(doc, update, UpdateOrigin.REDIS);
		}
	};

	public async setupWsConnection(ws: WebSocket, docName: string) {
		ws.binaryType = 'arraybuffer';

		// get doc, initialize if it does not exist yet
		const doc = await this.getDocument(docName);
		doc.connections.set(ws, new Set());

		ws.on('error', (err) => {
			this.logger.warning(new WebsocketErrorLoggable(err));
		});

		ws.on('message', (message: ArrayBufferLike) => {
			try {
				this.messageHandler(ws, doc, new Uint8Array(message));
			} catch (err) {
				this.logger.warning(new WebsocketMessageErrorLoggable(err));
			}
		});

		// send initial doc state to client as update
		this.sendInitialState(ws, doc);

		// check if connection is still alive
		const pingTimeout = this.configService.get<number>('TLDRAW_PING_TIMEOUT');
		let pongReceived = true;
		const pingInterval = setInterval(() => {
			if (pongReceived && doc.connections.has(ws)) {
				pongReceived = false;
				ws.ping();
				return;
			}

			this.closeConnection(doc, ws).catch((err) => {
				this.logger.warning(new CloseConnectionLoggable('pingInterval', err));
			});
			clearInterval(pingInterval);
		}, pingTimeout);

		ws.on('close', () => {
			this.closeConnection(doc, ws).catch((err) => {
				this.logger.warning(new CloseConnectionLoggable('websocket close', err));
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

	private async finalizeIfNoConnections(doc: WsSharedDocDo) {
		if (doc.connections.size > 0) {
			return;
		}

		try {
			const usedAssets = this.syncDocumentAssetsWithShapes(doc);
			await this.tldrawBoardRepo.compressDocument(doc.name);
			this.unsubscribeFromRedisChannels(doc);

			if (this.configService.get<number>('TLDRAW_ASSETS_SYNC_ENABLED')) {
				void this.filesStorageTldrawAdapterService.deleteUnusedFilesForDocument(doc.name, usedAssets).catch((err) => {
					this.logger.warning(new FileStorageErrorLoggable(doc.name, err));
				});
			}
		} catch (err) {
			this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while finalizing document', err));
		} finally {
			doc.destroy();
			this.docs.delete(doc.name);
			this.metricsService.decrementNumberOfBoardsOnServerCounter();
		}
	}

	private syncDocumentAssetsWithShapes(doc: WsSharedDocDo): TldrawAsset[] {
		// clean up assets that are not used as shapes anymore
		// which can happen when users do undo/redo operations on assets
		const assets: YMap<TldrawAsset> = doc.getMap('assets');
		const shapes: YMap<TldrawShape> = doc.getMap('shapes');
		const usedShapesAsAssets: TldrawShape[] = [];
		const usedAssets: TldrawAsset[] = [];

		for (const [, shape] of shapes) {
			if (shape.assetId) {
				usedShapesAsAssets.push(shape);
			}
		}

		doc.transact(() => {
			for (const [, asset] of assets) {
				const foundAsset = usedShapesAsAssets.some((shape) => shape.assetId === asset.id);
				if (!foundAsset) {
					assets.delete(asset.id);
				} else {
					usedAssets.push(asset);
				}
			}
		});

		return usedAssets;
	}

	private sendUpdateToConnectedClients(update: Uint8Array, doc: WsSharedDocDo): void {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		writeUpdate(encoder, update);
		const message = encoding.toUint8Array(encoder);

		for (const [conn] of doc.connections) {
			this.send(doc, conn, message);
		}
	}

	private prepareAwarenessMessage(changedClients: number[], doc: WsSharedDocDo): Uint8Array {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.AWARENESS);
		encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(doc.awareness, changedClients));
		const message = encoding.toUint8Array(encoder);
		return message;
	}

	private sendAwarenessMessage(message: Uint8Array, doc: WsSharedDocDo): void {
		for (const [conn] of doc.connections) {
			this.send(doc, conn, message);
		}
	}

	private manageClientsConnections(
		connectionsUpdate: AwarenessConnectionsUpdate,
		ws: WebSocket | null,
		doc: WsSharedDocDo
	): number[] {
		const changedClients = connectionsUpdate.added.concat(connectionsUpdate.updated, connectionsUpdate.removed);
		if (ws !== null) {
			const connControlledIDs = doc.connections.get(ws);
			if (connControlledIDs !== undefined) {
				for (const clientID of connectionsUpdate.added) {
					connControlledIDs.add(clientID);
				}

				for (const clientID of connectionsUpdate.removed) {
					connControlledIDs.delete(clientID);
				}
			}
		}

		return changedClients;
	}

	private registerAwarenessUpdateHandler(doc: WsSharedDocDo) {
		doc.awareness.on('update', (connectionsUpdate: AwarenessConnectionsUpdate, wsConnection: WebSocket | null) =>
			this.awarenessUpdateHandler(connectionsUpdate, wsConnection, doc)
		);
	}

	private registerUpdateHandler(doc: WsSharedDocDo) {
		doc.on('update', (update: Uint8Array, origin) => this.updateHandler(update, origin, doc));
	}

	private registerDatabaseUpdateHandler(doc: WsSharedDocDo) {
		doc.on('update', (update: Uint8Array, origin) => this.databaseUpdateHandler(doc.name, update, origin));
	}

	private subscribeToRedisChannels(doc: WsSharedDocDo) {
		this.sub.subscribe(doc.name, doc.awarenessChannel).catch((err) => {
			this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while subscribing to Redis channels', err));
		});
	}

	private unsubscribeFromRedisChannels(doc: WsSharedDocDo) {
		this.sub.unsubscribe(doc.name, doc.awarenessChannel).catch((err) => {
			this.logger.warning(new WsSharedDocErrorLoggable(doc.name, 'Error while unsubscribing from Redis channels', err));
		});
	}

	private publishUpdateToRedis(doc: WsSharedDocDo, update: Uint8Array, type: UpdateType) {
		const channel = type === UpdateType.AWARENESS ? doc.awarenessChannel : doc.name;
		this.pub.publish(channel, Buffer.from(update)).catch((err) => {
			this.logger.warning(new RedisPublishErrorLoggable(type, err));
		});
	}

	private sendInitialState(ws: WebSocket, doc: WsSharedDocDo): void {
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, WSMessageType.SYNC);
		writeUpdate(encoder, encodeStateAsUpdate(doc));
		this.send(doc, ws, encoding.toUint8Array(encoder));
	}

	private isClosedOrClosing(ws: WebSocket): boolean {
		return ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED;
	}

	private forceToArray(connections: Set<number> | undefined): number[] {
		return connections ? Array.from(connections) : [];
	}

	private isFromConnectedWebSocket(doc: WsSharedDocDo, origin: unknown) {
		return origin instanceof WebSocket && doc.connections.has(origin);
	}

	private isFromRedis(origin: unknown): boolean {
		return typeof origin === 'string' && origin === UpdateOrigin.REDIS;
	}
}
