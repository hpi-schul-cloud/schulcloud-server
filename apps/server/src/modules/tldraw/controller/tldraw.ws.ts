import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import cookie from 'cookie';
import { TldrawConfig, SOCKET_PORT } from '../config';
import { WsCloseCodeEnum, WsCloseMessageEnum } from '../types';
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
		const cookies = this.parseCookiesFromHeader(request);
		if (!cookies?.jwt) {
			this.closeClient(
				client,
				WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
				WsCloseMessageEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_JWT_NOT_PROVIDED_MESSAGE
			);
		} else {
			try {
				if (docName.length > 0 && this.configService.get<string>('FEATURE_TLDRAW_ENABLED')) {
					await this.tldrawWsService.authorizeConnection(docName, cookies.jwt);
					this.tldrawWsService.setupWSConnection(client, docName);
				} else {
					this.closeClient(
						client,
						WsCloseCodeEnum.WS_CLIENT_BAD_REQUEST_CODE,
						WsCloseMessageEnum.WS_CLIENT_BAD_REQUEST_MESSAGE
					);
				}
			} catch (e) {
				this.closeClient(
					client,
					WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
					WsCloseMessageEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_LACK_PERMISSION_MESSAGE
				);
			}
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

	public parseCookiesFromHeader(request: Request): { [p: string]: string } {
		const parsedCookies: { [p: string]: string } = cookie.parse(request.headers.cookie || '');
		return parsedCookies;
	}

	public closeClient(client: WebSocket, code: WsCloseCodeEnum, data: string): void {
		client.close(code, data);
	}
}
