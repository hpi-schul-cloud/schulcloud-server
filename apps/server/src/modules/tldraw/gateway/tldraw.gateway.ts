import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { encodeStateVector, encodeStateAsUpdate, applyUpdate, Doc } from 'yjs';
import { MongodbPersistence } from 'y-mongodb-provider';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig, SOCKET_PORT } from '@src/modules/tldraw/config';
import { setupWSConnection, setPersistence } from '../utils';

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
				const persistedYdoc = await this.getYDoc(mdb, docName);
				const persistedStateVector = encodeStateVector(persistedYdoc);
				const diff = encodeStateAsUpdate(ydoc, persistedStateVector);
				this.updateStoredDocWithDiff(mdb, docName, diff);

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

	private getDocNameFromRequest(request: Request): string {
		return request.url.slice(1).split('?')[0].replace('tldraw-server/', '');
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// eslint-disable-next-line consistent-return
	private async getYDoc(mdb: MongodbPersistence, docName: string): Promise<Doc> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
		const yDoc = await mdb.getYDoc(docName);
		if (yDoc instanceof Doc) {
			return yDoc;
		}
	}

	private updateStoredDocWithDiff(mdb: MongodbPersistence, docName: string, diff: Uint8Array) {
		if (diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0) > 0) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
			mdb.storeUpdate(docName, diff);
		}
	}
}
