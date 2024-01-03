import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import WebSocket from 'ws';
import { TextEncoder } from 'util';
import { INestApplication } from '@nestjs/common';
import { throwError } from 'rxjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { WsCloseCodeEnum, WsCloseMessageEnum } from '../../types';
import { TldrawWsTestModule } from '../../tldraw-ws-test.module';
import { TldrawWsService } from '../../service';
import { TestConnection } from '../../testing/test-connection';
import { TldrawWs } from '../tldraw.ws';

describe('WebSocketController (WsAdapter)', () => {
	let app: INestApplication;
	let gateway: TldrawWs;
	let ws: WebSocket;
	let wsService: TldrawWsService;
	let httpService: DeepMocked<HttpService>;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);
	const clientMessageMock = 'test-message';

	const getMessage = () => new TextEncoder().encode(clientMessageMock);

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [TldrawWsTestModule],
			providers: [
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();
		gateway = testingModule.get<TldrawWs>(TldrawWs);
		wsService = testingModule.get<TldrawWsService>(TldrawWsService);
		httpService = testingModule.get(HttpService);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] });
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

			expect(handleConnectionSpy).toHaveBeenCalled();
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

			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
				WsCloseMessageEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_MESSAGE
			);

			httpGetCallSpy.mockRestore();
			wsCloseSpy.mockRestore();
			ws.close();
		});

		it(`should refuse connection if jwt is wrong`, async () => {
			const { wsCloseSpy, httpGetCallSpy } = setup();
			const error = new Error('unknown error');

			httpGetCallSpy.mockReturnValueOnce(throwError(() => error));
			ws = await TestConnection.setupWs(wsUrl, 'TEST', { jwt: 'mock-wrong-jwt' });

			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
				WsCloseMessageEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_MESSAGE
			);

			httpGetCallSpy.mockRestore();
			wsCloseSpy.mockRestore();
			ws.close();
		});
	});

	describe('when checking docName and cookie', () => {
		const setup = () => {
			const setupConnectionSpy = jest.spyOn(wsService, 'setupWSConnection');
			const wsCloseSpy = jest.spyOn(WebSocket.prototype, 'close');

			return {
				setupConnectionSpy,
				wsCloseSpy,
			};
		};

		it(`should close for existing cookie and not existing docName`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			ws = await TestConnection.setupWs(wsUrl, '', { jwt: 'jwt-mocked' });
			ws.send(buffer);

			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCodeEnum.WS_CLIENT_BAD_REQUEST_CODE,
				WsCloseMessageEnum.WS_CLIENT_BAD_REQUEST_MESSAGE
			);

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			ws.close();
		});

		it(`should close for not authorizing connection`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest.spyOn(httpService, 'get');
			const error = new Error('unknown error');
			httpGetCallSpy.mockReturnValueOnce(throwError(() => error));

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { jwt: 'jwt-mocked' });
			ws.send(buffer);

			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCodeEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_CODE,
				WsCloseMessageEnum.WS_CLIENT_UNAUTHORISED_CONNECTION_MESSAGE
			);

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			httpGetCallSpy.mockRestore();
			ws.close();
		});

		it(`should setup connection for proper data`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest
				.spyOn(wsService, 'authorizeConnection')
				.mockImplementationOnce(() => Promise.resolve());

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { jwt: 'jwt-mocked' });
			ws.send(buffer);

			expect(setupConnectionSpy).toHaveBeenCalledWith(expect.anything(), 'TEST');

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			httpGetCallSpy.mockRestore();
			ws.close();
		});

		it(`should close after throw at setup connection`, async () => {
			const { setupConnectionSpy, wsCloseSpy } = setup();
			const { buffer } = getMessage();

			const httpGetCallSpy = jest
				.spyOn(wsService, 'authorizeConnection')
				.mockImplementationOnce(() => Promise.resolve());
			setupConnectionSpy.mockImplementationOnce(() => {
				throw new Error('unknown error');
			});

			ws = await TestConnection.setupWs(wsUrl, 'TEST', { jwt: 'jwt-mocked' });
			ws.send(buffer);

			expect(setupConnectionSpy).toHaveBeenCalledWith(expect.anything(), 'TEST');
			expect(wsCloseSpy).toHaveBeenCalledWith(
				WsCloseCodeEnum.WS_CLIENT_ESTABLISHING_CONNECTION_CODE,
				WsCloseMessageEnum.WS_CLIENT_ESTABLISHING_CONNECTION_MESSAGE
			);

			wsCloseSpy.mockRestore();
			setupConnectionSpy.mockRestore();
			httpGetCallSpy.mockRestore();
			ws.close();
		});
	});
});
