import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Injectable } from '@nestjs/common';
import express from 'express';
import * as http from 'http';

import * as Y from 'yjs';
import * as cors from 'cors';
import * as MongodbPersistence from 'y-mongodb-provider/src/y-mongodb';

@Injectable()
@WebSocketGateway(3333, { transports: ['websocket'] })
export class TldrawGateway {
	@WebSocketServer()
	server!: Server;


	constructor() {
			const wsPort = 3333;
			const connectionString = "mongodb://localhost:27017/myproject";
			const app = express();
			const server = http.createServer(app);

			const wss = new WebSocket.Server({noServer: true});


		// Set the persistence layer if needed
		// setPersistence(persistence_);

		// If persistence is set, you can retrieve it using:
		// const persistence = getPersistence();
	}

	@SubscribeMessage('events')
	handleEvent(@MessageBody('id') id: number): number {
		console.log('get events');
		// id === messageBody.id
		return id;
	}

	handleDisconnect(client: any) {
		// Handle WebSocket disconnection
		// No additional cleanup is required as the shared document will be automatically cleaned up
	}

	@SubscribeMessage('message')
	handleMessage(@MessageBody() message: string) {
		console.log('get message');
		// Handle incoming messages
		// Process the message and send appropriate responses if needed
	}


	//
	// constructor() {
	// 	this.initializeGateway();
	// }
	//
	// async initializeGateway() {
	// 	// Create Express app and HTTP server
	// 	const wsPort = 3333;
	// 	const connectionString = "mongodb://localhost:27017/myproject";
	// 	const app = express();
	// 	const server = http.createServer(app);
	//
	// 	const wss = new WebSocket.Server({noServer: true});
	//
	// 	wss.on('connection', (socket, request, user) => {
	// 		setupWSConnection.setupWSConnection(socket, request, user);
	// 	});
	//
	// 	app.use(express.json());
	// 	app.use(cors());
	//
	//
	// 	const mdb = new MongodbPersistence.MongodbPersistence(connectionString, {
	// 		collectionName: 'docs',
	// 		flushSize: 400,
	// 		multipleCollections: false,
	// 	});
	//
	// 	/*
	// 	 Persistence must have the following signature:
	// 	{ bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise }
	// 	*/
	// 	setupWSConnection.setPersistence({
	// 		bindState: async (docName, ydoc) => {
	// 			// Here you listen to granular document updates and store them in the database
	// 			// You don't have to do this, but it ensures that you don't lose content when the index crashes
	// 			// See https://github.com/yjs/yjs#Document-Updates for documentation on how to encode
	// 			// document updates
	//
	// 			const persistedYdoc = await mdb.getYDoc(docName);
	// 			const persistedStateVector = Y.encodeStateVector(persistedYdoc);
	// 			const diff = Y.encodeStateAsUpdate(ydoc, persistedStateVector);
	// 			console.log('UPDATE?');
	// 			if (diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0) > 0) {
	// 				mdb.storeUpdate(docName, diff);
	// 			}
	//
	// 			Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
	//
	// 			ydoc.on("update", async update => {
	// 				console.log('update!');
	// 				mdb.storeUpdate(docName, update);
	// 			});
	//
	// 			persistedYdoc.destroy();
	// 		},
	// 		writeState: async (docName, ydoc) => {
	// 			// This is called when all connections to the document are closed.
	//
	// 			await mdb.flushDocument(docName);
	// 		}
	// 	})
	//
	// 	server.on('upgrade', (request, socket, head) => {
	// 		const handleAuth = ws => {
	//
	// 			console.log('upgrade!');
	// 			wss.emit('connection', ws, request)
	// 		}
	// 		wss.handleUpgrade(request, socket, head, handleAuth)
	// 	});
	//
	// 	server.listen(wsPort, () => {
	// 		console.log(`running at on port ${wsPort}`)
	// 	});
	//
	// }
}
