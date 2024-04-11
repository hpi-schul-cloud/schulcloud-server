import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import WebSocket from 'ws';
import { TextEncoder } from 'util';
import { INestApplication, NotAcceptableException } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { createConfigModuleOptions } from '@src/config';
import { Logger } from '@src/core/logger';
import { of, throwError } from 'rxjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { axiosResponseFactory } from '@shared/testing';
import { TldrawRedisFactory, TldrawRedisService } from '../../redis';
import { TldrawDrawing } from '../../entities';
import { TldrawWsService } from '../../service';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from '../../repo';
import { TestConnection, tldrawTestConfig } from '../../testing';
import { MetricsService } from '../../metrics';
import { TldrawWs } from '..';
import { WsCloseCode, WsCloseMessage } from '../../types';
import { TldrawConfig } from '../../config';

describe('WebSocketController (WsAdapter)', () => {
	let app: INestApplication;
	let gateway: TldrawWs;
	let ws: WebSocket;
	let wsService: TldrawWsService;
	let httpService: DeepMocked<HttpService>;
	let configService: ConfigService<TldrawConfig, true>;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);
	const clientMessageMock = 'test-message';

	const getMessage = () => new TextEncoder().encode(clientMessageMock);

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(tldrawTestConfig)),
			],
			providers: [
				TldrawWs,
				TldrawWsService,
				TldrawBoardRepo,
				YMongodb,
				MetricsService,
				TldrawRedisFactory,
				TldrawRedisService,
				{
					provide: TldrawRepo,
					useValue: createMock<TldrawRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		gateway = testingModule.get(TldrawWs);
		wsService = testingModule.get(TldrawWsService);
		httpService = testingModule.get(HttpService);
		configService = testingModule.get(ConfigService);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('when tldraw connection is established', () => {
		const setup = async () => {
			const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
			jest.spyOn(Uint8Array.prototype, 'reduce').mockReturnValueOnce(1);

			ws = await TestConnection.setupWs(wsUrl, 'TEST');
			const { buffer } = getMessage();

			return { handleConnectionSpy, buffer };
		};

		it(`should handle connection`, async () => {
			const { handleConnectionSpy, buffer } = await setup();

			ws.send(buffer, () => {});

			expect(handleConnectionSpy).toHaveBeenCalledTimes(1);
			handleConnectionSpy.mockRestore();
			ws.close();
		});

		it(`check if client will receive message`, async () => {
			const { handleConnectionSpy, buffer } = await setup();
			ws.send(buffer, () => {});

			gateway.server.on('connection', (client) => {
				client.on('message', (payload) => {
					expect(payload).toBeInstanceOf(ArrayBuffer);
				});
			});

			handleConnectionSpy.mockRestore();
			ws.close();
		});
	});

	describe('when tldraw doc has multiple clients', () => {
		const setup = async () => {
			const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
			ws = await TestConnection.setupWs(wsUrl, 'TEST');
			const ws2 = await TestConnection.setupWs(wsUrl, 'TEST');

			const { buffer } = getMessage();

			return {
				handleConnectionSpy,
				ws2,
				buffer,
			};
		};

		it(`should handle 2 connections at same doc and data transfer`, async () => {
			const { handleConnectionSpy, ws2, buffer } = await setup();

			ws.send(buffer);
			ws2.send(buffer);

			expect(handleConnectionSpy).toHaveBeenCalledTimes(2);

			handleConnectionSpy.mockRestore();
			ws.close();
			ws2.close();
		});
	});

	describe('when checking cookie', () => {
		const setup = () => {
			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const wsCloseSpy = jest.spyOn(WebSocket.prototype, 'close');

			return {
				httpGetCallSpy,
				wsCloseSpy,
			};
		};

		it(`should refuse connection if there is no jwt in cookie`, async () => {
			const { httpGetCallSpy, wsCloseSpy } = setup();

			ws = await TestConnection.setupWs(wsUrl, 'TEST', {});

			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.UNAUTHORIZED, Buffer.from(WsCloseMessage.UNAUTHORIZED));

			httpGetCallSpy.mockRestore();
			wsCloseSpy.mockRestore();
			ws.close();
		});

		it(`should refuse connection if jwt is wrong`, async () => {
			const { wsCloseSpy, httpGetCallSpy } = setup();
			const error = new Error('unknown error');

			httpGetCallSpy.mockReturnValueOnce(throwError(() => error));
			ws = await TestConnection.setupWs(wsUrl, 'TEST', { cookie: 'jwt=jwt-mocked' });

			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.UNAUTHORIZED, Buffer.from(WsCloseMessage.UNAUTHORIZED));

			httpGetCallSpy.mockRestore();
			wsCloseSpy.mockRestore();
			ws.close();
		});
	});

	describe('when tldraw feature is disabled', () => {
		const setup = () => {
			const wsCloseSpy = jest.spyOn(WebSocket.prototype, 'close');
			const configSpy = jest.spyOn(configService, 'get').mockReturnValueOnce(false);

			return {
				wsCloseSpy,
				configSpy,
			};
		};

		it('should close', async () => {
			const { wsCloseSpy } = setup();

			ws = await TestConnection.setupWs(wsUrl, 'test-doc');

			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.BAD_REQUEST, Buffer.from(WsCloseMessage.FEATURE_DISABLED));

			wsCloseSpy.mockRestore();
			ws.close();
		});
	});

	describe('when checking docName and cookie', () => {
		const setup = () => {
			const setupConnectionSpy = jest.spyOn(wsService, 'setupWsConnection');
			const wsCloseSpy = jest.spyOn(WebSocket.prototype, 'close');
			const closeConnSpy = jest.spyOn(wsService, 'closeConnection').mockRejectedValue(new Error('error'));

			return {
				setupConnectionSpy,
				wsCloseSpy,
				closeConnSpy,
			};
		};

		it(`should close for existing cookie and not existing docName`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			ws = await TestConnection.setupWs(wsUrl, '', { cookie: 'jwt=jwt-mocked' });
			ws.send(buffer);

			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.BAD_REQUEST, Buffer.from(WsCloseMessage.BAD_REQUEST));

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			ws.close();
		});

		it(`should close for not existing docName resource`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const error = new AxiosError('unknown error', '404', undefined, undefined, {
				config: { headers: new AxiosHeaders() },
				data: undefined,
				headers: {},
				statusText: '404',
				status: 404,
			});
			httpGetCallSpy.mockReturnValueOnce(throwError(() => error));

			ws = await TestConnection.setupWs(wsUrl, 'GLOBAL', { cookie: 'jwt=jwt-mocked' });

			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.NOT_FOUND, Buffer.from(WsCloseMessage.NOT_FOUND));

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			ws.close();
		});

		it(`should close for not authorized connection`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const error = new AxiosError('unknown error', '401', undefined, undefined, {
				config: { headers: new AxiosHeaders() },
				data: undefined,
				headers: {},
				statusText: '401',
				status: 401,
			});
			httpGetCallSpy.mockReturnValueOnce(throwError(() => error));

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { cookie: 'jwt=jwt-mocked' });
			ws.send(buffer);

			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.UNAUTHORIZED, Buffer.from(WsCloseMessage.UNAUTHORIZED));

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			httpGetCallSpy.mockRestore();
			ws.close();
		});

		it(`should close on unexpected error code`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const error = new AxiosError('unknown error', '418', undefined, undefined, {
				config: { headers: new AxiosHeaders() },
				data: undefined,
				headers: {},
				statusText: '418',
				status: 418,
			});
			httpGetCallSpy.mockReturnValueOnce(throwError(() => error));

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { cookie: 'jwt=jwt-mocked' });
			ws.send(buffer);

			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCode.INTERNAL_SERVER_ERROR,
				Buffer.from(WsCloseMessage.INTERNAL_SERVER_ERROR)
			);

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			httpGetCallSpy.mockRestore();
			ws.close();
		});

		it(`should setup connection for proper data`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const axiosResponse: AxiosResponse = axiosResponseFactory.build({
				data: '',
			});

			httpGetCallSpy.mockImplementationOnce(() => of(axiosResponse));

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { cookie: 'jwt=jwt-mocked' });
			ws.send(buffer);

			expect(setupConnectionSpy).toHaveBeenCalledWith(expect.anything(), 'TEST');

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			ws.close();
		});

		it(`should close after throw at setup connection`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const axiosResponse: AxiosResponse = axiosResponseFactory.build({
				data: '',
			});
			httpGetCallSpy.mockReturnValueOnce(of(axiosResponse));
			setupConnectionSpy.mockImplementationOnce(() => {
				throw new Error('unknown error');
			});

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { cookie: 'jwt=jwt-mocked' });
			ws.send(buffer);

			expect(setupConnectionSpy).toHaveBeenCalledWith(expect.anything(), 'TEST');
			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCode.INTERNAL_SERVER_ERROR,
				Buffer.from(WsCloseMessage.INTERNAL_SERVER_ERROR)
			);

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			ws.close();
		});

		it('should close after setup connection throws NotAcceptableException', async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const axiosResponse: AxiosResponse = axiosResponseFactory.build({
				data: '',
			});
			httpGetCallSpy.mockReturnValueOnce(of(axiosResponse));
			setupConnectionSpy.mockImplementationOnce(() => {
				throw new NotAcceptableException();
			});

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { cookie: 'jwt=jwt-mocked' });
			ws.send(buffer);

			expect(setupConnectionSpy).toHaveBeenCalledWith(expect.anything(), 'TEST');
			expect(wsCloseSpy).toHaveBeenCalledWith(WsCloseCode.NOT_ACCEPTABLE, Buffer.from(WsCloseMessage.NOT_ACCEPTABLE));

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			ws.close();
		});
	});
});
