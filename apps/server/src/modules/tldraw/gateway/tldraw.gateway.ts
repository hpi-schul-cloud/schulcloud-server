import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { encodeStateVector, encodeStateAsUpdate, applyUpdate, Doc } from 'yjs';
import * as MongodbPersistence from 'y-mongodb-provider';
import { NodeEnvType } from '@src/modules/server';
import { ConfigService } from '@nestjs/config';
import { TlDrawConfig } from '@src/modules/tldraw/tldraw.config';
import { WSSharedDoc, setupWSConnection, setPersistence } from '../utils';

@WebSocketGateway(3345)
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	doc: WSSharedDoc | undefined;

	connectionString: string;

	constructor(private readonly configService: ConfigService<TlDrawConfig, true>) {
		const NODE_ENV = this.configService.get<string>('NODE_ENV');

		switch (NODE_ENV) {
			case NodeEnvType.TEST:
				this.connectionString = 'mongodb://127.0.0.1:27017/tldraw-test';
				break;
			default:
				this.connectionString = 'mongodb://127.0.0.1:27017/tldraw';
		}
	}

	handleConnection(client: WebSocket, request: Request) {
		const docName = request.url.slice(1).split('?')[0];
		setupWSConnection(client, docName);
	}

	afterInit() {
		const mdb = new MongodbPersistence.MongodbPersistence(this.connectionString, {
			collectionName: 'docs',
			flushSize: 400,
			multipleCollections: false,
		}) as MongodbPersistence;

		setPersistence({
			bindState: async (docName, ydoc) => {
				const persistedYdoc = await (mdb.getYDoc(docName) as Promise<Doc>);
				const persistedStateVector = encodeStateVector(persistedYdoc);
				const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
				if (diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0) > 0) {
					mdb.storeUpdate(docName, diff);
				}

				applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

				ydoc.on('update', (update) => {
					mdb.storeUpdate(docName, update);
				});

				persistedYdoc.destroy();
			},
			writeState: async (docName) => {
				// This is called when all connections to the document are closed.
				await mdb.flushDocument(docName);
			},
		});
	}
}
