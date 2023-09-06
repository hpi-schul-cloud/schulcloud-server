import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { MongodbPersistence } from 'y-mongodb-provider';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig, SOCKET_PORT } from '@src/modules/tldraw/config';
import { setupWSConnection, setPersistence, updateDocument } from '../utils';

@WebSocketGateway(SOCKET_PORT)
export class TldrawGateway implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	connectionString: string;

	constructor(readonly configService: ConfigService<TldrawConfig, true>) {
		this.connectionString = this.configService.get<string>('CONNECTION_STRING');
	}

	handleConnection(client: WebSocket, request: Request) {
		const docName = this.getDocNameFromRequest(request);

		if (docName.length > 0 && this.configService.get<string>('FEATURE_TLDRAW_ENABLED')) {
			setupWSConnection(client, docName);
		} else {
			client.close(4000, 'Document name is mandatory in url or Tldraw Tool is turned off.');
		}
	}

	afterInit() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
		const mdb = new MongodbPersistence(this.connectionString, {
			collectionName: this.configService.get<string>('TLDRAW_DB_COLLECTION_NAME') ?? 'drawings',
			flushSize: this.configService.get<number>('TLDRAW_DB_FLUSH_SIZE') ?? 400,
			multipleCollections: this.configService.get<boolean>('TLDRAW_DB_MULTIPLE_COLLECTIONS'),
		});

		setPersistence({
			bindState: async (docName, ydoc) => {
				await updateDocument(mdb, docName, ydoc);
			},
			writeState: async (docName) => {
				// This is called when all connections to the document are closed.
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				await mdb.flushDocument(docName);
			},
		});
	}

	private getDocNameFromRequest(request: Request): string {
		return request.url.slice(1).split('?')[0].replace('tldraw-server/', '');
	}
}
