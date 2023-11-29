import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { ConfigService } from '@nestjs/config';
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

	public handleConnection(client: WebSocket, request: Request): void {
		const docName = this.getDocNameFromRequest(request);

		if (docName.length > 0 && this.configService.get<string>('FEATURE_TLDRAW_ENABLED')) {
			this.tldrawWsService.setupWSConnection(client, docName);
		} else {
			client.close(
				WsCloseCodeEnum.WS_CLIENT_BAD_REQUEST_CODE,
				'Document name is mandatory in url or Tldraw Tool is turned off.'
			);
		}
	}

	public async afterInit(): Promise<void> {
		await this.tldrawWsService.createDbIndex();
	}

	private getDocNameFromRequest(request: Request): string {
		const urlStripped = request.url.replace('/', '');
		return urlStripped;
	}
}
