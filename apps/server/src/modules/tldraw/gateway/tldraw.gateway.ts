import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { encodeStateVector, encodeStateAsUpdate, applyUpdate, Doc } from 'yjs';
import { MongodbPersistence } from 'y-mongodb-provider';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig } from '@src/modules/tldraw/config';
import { WSSharedDoc, setupWSConnection, setPersistence } from '../utils';

@WebSocketGateway(3345)
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	doc: WSSharedDoc | undefined;

	connectionString: string;

	constructor(private readonly configService: ConfigService<TldrawConfig, true>) {
		this.connectionString = this.configService.get<string>('CONNECTION_STRING');
	}

	handleConnection(client: WebSocket, request: Request) {
		const docName = request.url.slice(1).split('?')[0];

		if (docName.length > 0) {
			setupWSConnection(client, docName);
		} else {
			client.close(4000, 'Document name is mandatory in url.');
		}
	}

	afterInit() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
		const mdb = new MongodbPersistence(this.connectionString, {
			collectionName: this.configService.get<string>('TLDRAW_DB_COLLECTION_NAME') ?? 'drawings',
			flushSize: this.configService.get<string>('TLDRAW_DB_FLUSH_SIZE') ?? 400,
			multipleCollections: this.configService.get<string>('TLDRAW_DB_MULTIPLE_COLLECTIONS'),
		});

		setPersistence({
			bindState: async (docName, ydoc) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				const persistedYdoc = await (mdb.getYDoc(docName) as Promise<Doc>);
				const persistedStateVector = encodeStateVector(persistedYdoc);
				const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
				if (diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0) > 0) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
					mdb.storeUpdate(docName, diff);
				}

				applyUpdate(ydoc, encodeStateAsUpdate(persistedYdoc));

				ydoc.on('update', (update) => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
					mdb.storeUpdate(docName, update);
				});

				persistedYdoc.destroy();
			},
			writeState: async (docName) => {
				// This is called when all connections to the document are closed.
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				await mdb.flushDocument(docName);
			},
		});
	}
}
