import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayInit,
	OnGatewayConnection,
	SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as Y from 'yjs';
import * as MongodbPersistence from 'y-mongodb-provider';
import { closeConn, getYDoc, messageHandler, WSSharedDoc } from '@src/modules/tldraw/utils/utils';
const setupWSConnection = require('./../utils/utils');
const connectionString = 'mongodb://127.0.0.1:27017/myproject';

@WebSocketGateway()
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server!: any;
	doc: WSSharedDoc = {};

	handleConnection(client: any, ...args: any[]) {
		client.binaryType = 'arraybuffer';
		const docName = client.handshake.query['roomName'] ?? 'GLOBAL';
		this.doc = getYDoc(docName, true);
		this.doc.conns.set(client, new Set());
		setupWSConnection.setupWSConnection(client, this.doc);
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

	@SubscribeMessage('message')
	handleMessage(
		@MessageBody() data: ArrayBufferLike,
		@ConnectedSocket() client: any
	) {
		messageHandler(client, this.doc, new Uint8Array(data));
	}

}
