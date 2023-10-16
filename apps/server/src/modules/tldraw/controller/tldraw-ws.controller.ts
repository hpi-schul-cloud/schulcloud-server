import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Request } from 'express';
import { MongodbPersistence } from 'y-mongodb-provider';
import { ConfigService } from '@nestjs/config';
import cookie from 'cookie';
import { TldrawConfig, SOCKET_PORT } from '../config';
import { WsCloseCodeEnum } from '../types/ws-close-code-enum';
import { TldrawWsService } from '../service/tldraw-ws.service';
import { setupWSConnection, setPersistence, updateDocument } from '../utils';

@WebSocketGateway(SOCKET_PORT)
export class TldrawWsController implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	connectionString: string;

	constructor(
		readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawWsService: TldrawWsService
	) {
		this.connectionString = this.configService.get<string>('CONNECTION_STRING');
	}

	async handleConnection(client: WebSocket, request: Request) {
		const docName = this.getDocNameFromRequest(request);
		const cookies = cookie.parse(request.headers.cookie || '');
		if (!cookies?.jwt) {
			client.close(WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE, 'Unauthorised connection.');
		}
		try {
			await this.tldrawWsService.authorizeConnection(docName, cookies.jwt);
		} catch (e) {
			client.close(
				WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
				"Unauthorised connection - you don't have permission to this drawing."
			);
		}
		if (docName.length > 0 && this.configService.get<string>('FEATURE_TLDRAW_ENABLED')) {
			setupWSConnection(client, docName);
		} else {
			client.close(
				WsCloseCodeEnum.WS_CLIENT_BAD_REQUEST_CODE,
				'Document name is mandatory in url or Tldraw Tool is turned off.'
			);
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
		const urlStripped = request.url.replace('/', '');
		return urlStripped;
	}
}
