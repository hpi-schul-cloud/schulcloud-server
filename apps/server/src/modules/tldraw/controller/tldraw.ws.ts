import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import cookie from 'cookie';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { WebsocketCloseErrorLoggable } from '../loggable/websocket-close-error.loggable';
import { TldrawConfig, SOCKET_PORT } from '../config';
import { WsCloseCodeEnum, WsCloseMessageEnum } from '../types';
import { TldrawWsService } from '../service';

@WebSocketGateway(SOCKET_PORT)
export class TldrawWs implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	private apiHostUrl: string;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawWsService: TldrawWsService,
		private readonly httpService: HttpService,
		private readonly logger: Logger
	) {
		this.apiHostUrl = this.configService.get<string>('API_HOST');
	}

	async handleConnection(client: WebSocket, request: Request): Promise<void> {
		const docName = this.getDocNameFromRequest(request);
		if (docName.length > 0 && this.configService.get<string>('FEATURE_TLDRAW_ENABLED')) {
			console.log(1);
			const cookies = this.parseCookiesFromHeader(request);
			try {
				console.log(2);
				await this.authorizeConnection(docName, cookies?.jwt);
			} catch (err) {
				console.log(3);
				if ((err as AxiosError).response?.status === 404 || (err as AxiosError).response?.status === 400) {
					this.closeClientAndLogError(
						client,
						WsCloseCodeEnum.WS_CLIENT_NOT_FOUND_CODE,
						WsCloseMessageEnum.WS_CLIENT_NOT_FOUND_MESSAGE,
						err as Error
					);
				} else {
					this.closeClientAndLogError(
						client,
						WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
						WsCloseMessageEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_MESSAGE,
						err as Error
					);
				}
				return;
			}
			try {
				console.log(4);
				this.tldrawWsService.setupWSConnection(client, docName);
				console.log(5);
			} catch (err) {
				this.closeClientAndLogError(
					client,
					WsCloseCodeEnum.WS_CLIENT_ESTABLISHING_CONNECTION_CODE,
					WsCloseMessageEnum.WS_CLIENT_ESTABLISHING_CONNECTION_MESSAGE,
					err as Error
				);
			}
		} else {
			console.log(6);
			this.closeClientAndLogError(
				client,
				WsCloseCodeEnum.WS_CLIENT_BAD_REQUEST_CODE,
				WsCloseMessageEnum.WS_CLIENT_BAD_REQUEST_MESSAGE,
				new BadRequestException()
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

	private parseCookiesFromHeader(request: Request): { [p: string]: string } {
		const parsedCookies: { [p: string]: string } = cookie.parse(request.headers.cookie || '');
		return parsedCookies;
	}

	private closeClientAndLogError(client: WebSocket, code: WsCloseCodeEnum, data: string, err: Error): void {
		client.close(code, data);
		this.logger.warning(new WebsocketCloseErrorLoggable(err, `(${code}) ${data}`));
	}

	private async authorizeConnection(drawingName: string, token: string) {
		if (!token) {
			throw new UnauthorizedException('Token was not given');
		}
		const headers = {
			Accept: 'Application/json',
			Authorization: `Bearer ${token}`,
		};

		await firstValueFrom(
			this.httpService.get(`${this.apiHostUrl}/v3/elements/${drawingName}/permission`, {
				headers,
			})
		);
	}
}
