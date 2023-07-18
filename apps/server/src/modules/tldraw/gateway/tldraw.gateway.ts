import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { encodeStateVector, encodeStateAsUpdate, applyUpdate, Doc } from 'yjs';
import * as MongodbPersistence from 'y-mongodb-provider';
import { NodeEnvType } from '@src/modules/server';
import { Configuration } from '@hpi-schul-cloud/commons';
import { WSSharedDoc, setupWSConnection, setPersistence } from '../utils';

let connectionString: string;

const ENVIRONMENTS = {
	DEVELOPMENT: 'development',
	TEST: 'test',
	PRODUCTION: 'production',
	MIGRATION: 'migration',
};

const NODE_ENV = Configuration.get('NODE_ENV') as NodeEnvType;

switch (NODE_ENV) {
	case ENVIRONMENTS.TEST:
		connectionString = 'mongodb://127.0.0.1:27017/tldraw-test';
		break;
	default:
		connectionString = 'mongodb://127.0.0.1:27017/tldraw';
}

@WebSocketGateway(3345)
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	doc: WSSharedDoc | undefined;

	handleConnection(client: WebSocket, request: Request) {
		const docName = request.url.slice(1).split('?')[0];
		setupWSConnection(client, docName);
	}

	afterInit() {
		const mdb = new MongodbPersistence.MongodbPersistence(connectionString, {
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
