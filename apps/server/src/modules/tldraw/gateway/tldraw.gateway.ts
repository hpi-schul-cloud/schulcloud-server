import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as Y from 'yjs';
import * as MongodbPersistence from 'y-mongodb-provider';
import { closeConn, WSSharedDoc, setupWSConnection, setPersistence } from '@src/modules/tldraw/utils/utils';

let connectionString: string;

const ENVIRONMENTS = {
	DEVELOPMENT: 'development',
	TEST: 'test',
	PRODUCTION: 'production',
	MIGRATION: 'migration',
};

const { NODE_ENV = ENVIRONMENTS.DEVELOPMENT } = process.env;

switch (NODE_ENV) {
	case ENVIRONMENTS.TEST:
		connectionString = 'mongodb://127.0.0.1:27017/tldraw-test';
		break;
	default:
		connectionString = 'mongodb://127.0.0.1:27017/tldraw';
}


@WebSocketGateway(3345)
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server!: Server;
	doc: WSSharedDoc | undefined;

	handleConnection(client: any, request) {
		const docName =  request.url.slice(1).split('?')[0];
		setupWSConnection(client, docName);
	}

	handleDisconnect(client: any): any {
		closeConn(this.doc, client);
	}

	afterInit(server: Server) {
		const mdb = new MongodbPersistence.MongodbPersistence(connectionString, {
			collectionName: 'docs',
			flushSize: 400,
			multipleCollections: false
		});

		setPersistence({
			bindState: async (docName, ydoc) => {
				const persistedYdoc = await mdb.getYDoc(docName);
				const persistedStateVector = Y.encodeStateVector(persistedYdoc);
				const diff = Y.encodeStateAsUpdate(ydoc, persistedStateVector);
				if (diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0) > 0) {
					mdb.storeUpdate(docName, diff);
				}

				Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

				ydoc.on('update', async update => {
					mdb.storeUpdate(docName, update);
				});

				persistedYdoc.destroy();
			},
			writeState: async (docName) => {
				// This is called when all connections to the document are closed.
				await mdb.flushDocument(docName);
			}
		});
	}
}
