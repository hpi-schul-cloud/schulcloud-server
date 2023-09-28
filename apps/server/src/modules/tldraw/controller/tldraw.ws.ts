import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { ConfigService } from '@nestjs/config';
import { TldrawConfig, SOCKET_PORT } from '@src/modules/tldraw/config';
import { WsCloseCodeEnum } from '@src/modules/tldraw/types/ws-close-code-enum';
import { TldrawWsService } from '@src/modules/tldraw/service';

@WebSocketGateway(SOCKET_PORT)
export class TldrawWs implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	constructor(
		readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawWsService: TldrawWsService
	) {}

	handleConnection(client: WebSocket, request: Request) {
		const docName = this.getDocNameFromRequest(request);

		if (docName.length > 0 && this.configService.get<string>('FEATURE_TLDRAW_ENABLED')) {
			this.tldrawWsService.setupWSConnection(client, docName);
		} else {
			client.close(
				WsCloseCodeEnum.WS_CUSTOM_CLIENT_CLOSE_CODE,
				'Document name is mandatory in url or Tldraw Tool is turned off.'
			);
		}
	}

	afterInit() {
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
		return request.url.slice(1).split('?')[0].replace('tldraw-server/', '');
	}
}
