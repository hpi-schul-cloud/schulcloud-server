import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import cookie from 'cookie';
import { TldrawConfig, SOCKET_PORT } from '../config';
import { WsCloseCodeEnum } from '../types';
import { TldrawWsService } from '../service';

@WebSocketGateway(SOCKET_PORT)
export class TldrawWs implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawWsService: TldrawWsService
	) {}

	async handleConnection(client: WebSocket, request: Request): Promise<void> {
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
			this.tldrawWsService.setupWSConnection(client, docName);
		} else {
			client.close(
				WsCloseCodeEnum.WS_CLIENT_BAD_REQUEST_CODE,
				'Document name is mandatory in url or Tldraw Tool is turned off.'
			);
		}
	}

	public afterInit(): void {
		this.tldrawWsService.setPersistence({
			bindState: async (docName, ydoc) => {
				await this.tldrawWsService.updateDocument(docName, ydoc);
			},
			writeState: async (docName) => {
				// This is called when all connections to the document are closed.
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
				await this.tldrawWsService.flushDocument(docName);
			},
		});
	}

	private getDocNameFromRequest(request: Request): string {
		const urlStripped = request.url.replace(/(\/)|(tldraw-server)/g, '');
		return urlStripped;
	}
}
