import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import WebSocket, { Server } from 'ws';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import cookie from 'cookie';
import {
	InternalServerErrorException,
	UnauthorizedException,
	NotFoundException,
	NotAcceptableException,
} from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { WebsocketInitErrorLoggable } from '../loggable';
import { TldrawConfig, TLDRAW_SOCKET_PORT } from '../config';
import { WsCloseCode, WsCloseMessage } from '../types';
import { TldrawWsService } from '../service';

@WebSocketGateway(TLDRAW_SOCKET_PORT)
export class TldrawWs implements OnGatewayInit, OnGatewayConnection {
	@WebSocketServer()
	server!: Server;

	constructor(
		private readonly configService: ConfigService<TldrawConfig, true>,
		private readonly tldrawWsService: TldrawWsService,
		private readonly httpService: HttpService,
		private readonly logger: Logger
	) {}

	public async handleConnection(client: WebSocket, request: Request): Promise<void> {
		if (!this.configService.get<boolean>('FEATURE_TLDRAW_ENABLED')) {
			client.close(WsCloseCode.BAD_REQUEST, WsCloseMessage.FEATURE_DISABLED);
			return;
		}

		const docName = this.getDocNameFromRequest(request);
		if (!docName) {
			client.close(WsCloseCode.BAD_REQUEST, WsCloseMessage.BAD_REQUEST);
			return;
		}

		try {
			const cookies = this.parseCookiesFromHeader(request);
			await this.authorizeConnection(docName, cookies?.jwt);
			await this.tldrawWsService.setupWsConnection(client, docName);
		} catch (err) {
			this.handleError(err, client, docName);
		}
	}

	public async afterInit(): Promise<void> {
		await this.tldrawWsService.createDbIndex();
	}

	private getDocNameFromRequest(request: Request): string {
		const urlStripped = request.url.replace(/(\/)|(tldraw-server)/g, '');
		return urlStripped;
	}

	private parseCookiesFromHeader(request: Request): { [p: string]: string } {
		const parsedCookies: { [p: string]: string } = cookie.parse(request.headers.cookie || '');
		return parsedCookies;
	}

	private async authorizeConnection(drawingName: string, token: string): Promise<void> {
		if (!token) {
			throw new UnauthorizedException('Token was not given');
		}

		try {
			const apiHostUrl = this.configService.get<string>('API_HOST');
			await firstValueFrom(
				this.httpService.get(`${apiHostUrl}/v3/elements/${drawingName}/permission`, {
					headers: {
						Accept: 'Application/json',
						Authorization: `Bearer ${token}`,
					},
				})
			);
		} catch (err) {
			if (isAxiosError(err)) {
				switch (err.response?.status) {
					case 400:
					case 404:
						throw new NotFoundException();
					case 401:
					case 403:
						throw new UnauthorizedException();
					default:
						throw new InternalServerErrorException();
				}
			}

			throw new InternalServerErrorException();
		}
	}

	private closeClientAndLog(
		client: WebSocket,
		code: WsCloseCode,
		message: WsCloseMessage,
		docName: string,
		err?: unknown
	): void {
		client.close(code, message);
		this.logger.warning(new WebsocketInitErrorLoggable(code, message, docName, err));
	}

	private handleError(err: unknown, client: WebSocket, docName: string): void {
		if (err instanceof NotFoundException) {
			this.closeClientAndLog(client, WsCloseCode.NOT_FOUND, WsCloseMessage.NOT_FOUND, docName);
			return;
		}

		if (err instanceof UnauthorizedException) {
			this.closeClientAndLog(client, WsCloseCode.UNAUTHORIZED, WsCloseMessage.UNAUTHORIZED, docName);
			return;
		}

		if (err instanceof NotAcceptableException) {
			this.closeClientAndLog(client, WsCloseCode.NOT_ACCEPTABLE, WsCloseMessage.NOT_ACCEPTABLE, docName);
			return;
		}

		this.closeClientAndLog(
			client,
			WsCloseCode.INTERNAL_SERVER_ERROR,
			WsCloseMessage.INTERNAL_SERVER_ERROR,
			docName,
			err
		);
	}
}
