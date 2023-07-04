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
import { closeConn, getYDoc, WSSharedDoc } from '@src/modules/tldraw/utils/utils';
const setupWSConnection = require('./../utils/utils');
const connectionString = 'mongodb://127.0.0.1:27017/myproject';

@WebSocketGateway(3345)
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server!: Server;
	doc: WSSharedDoc = {};

	handleConnection(client: any, request) {
		client.binaryType = 'arraybuffer';
		const docName =  request.url.slice(1).split('?')[0];
		this.doc = getYDoc(docName, true);
		this.doc.conns.set(client, new Set());
		setupWSConnection.setupWSConnection(client, docName);
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

		setupWSConnection.setPersistence({
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
