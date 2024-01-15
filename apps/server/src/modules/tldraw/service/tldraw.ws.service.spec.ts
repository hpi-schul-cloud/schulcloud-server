import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { TextEncoder } from 'util';
import * as Yjs from 'yjs';
import * as SyncProtocols from 'y-protocols/sync';
import * as AwarenessProtocol from 'y-protocols/awareness';
import * as Ioredis from 'ioredis';
import { encoding } from 'lib0';
import { TldrawWsFactory } from '@shared/testing/factory/tldraw.ws.factory';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { axiosResponseFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { TldrawWs } from '../controller';
import { TldrawDrawing } from '../entities';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from '../repo';
import { TestConnection, tldrawTestConfig } from '../testing';
import { WsSharedDocDo } from '../domain';
import { TldrawWsService } from '.';
import { TldrawConfig } from '../config';
import { MetricsService } from '../metrics';

jest.mock('yjs', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('yjs'),
	};
	return moduleMock;
});
jest.mock('y-protocols/awareness', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('y-protocols/awareness'),
	};
	return moduleMock;
});
jest.mock('y-protocols/sync', () => {
	const moduleMock: unknown = {
		__esModule: true,
		...jest.requireActual('y-protocols/sync'),
	};
	return moduleMock;
});

describe('TldrawWSService', () => {
	let app: INestApplication;
	let ws: WebSocket;
	let configService: ConfigService<TldrawConfig, true>;
	let service: TldrawWsService;
	let boardRepo: TldrawBoardRepo;
	let metricsService: MetricsService;
	let logger: DeepMocked<Logger>;
	let httpService: DeepMocked<HttpService>;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

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

		configService = testingModule.get(ConfigService);
		service = testingModule.get(TldrawWsService);
		httpService = testingModule.get(HttpService);
		metricsService = testingModule.get(MetricsService);
		boardRepo = testingModule.get(TldrawBoardRepo);
		logger = testingModule.get(Logger);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	const createMessage = (values: number[]) => {
		const encoder = encoding.createEncoder();
		values.forEach((val) => {
			encoding.writeVarUint(encoder, val);
		});
		encoding.writeVarUint(encoder, 0);
		encoding.writeVarUint(encoder, 1);
		const msg = encoding.toUint8Array(encoder);

		return {
			msg,
		};
	};

	it('should check if service properties are set correctly', () => {
		expect(service).toBeDefined();
		expect(service.pingTimeout).toBeDefined();
	});

	describe('constructor', () => {
		it('should throw if REDIS_URI is not set', () => {
			const configSpy = jest.spyOn(configService, 'get').mockReturnValue(null);

			expect(() => new TldrawWsService(configService, boardRepo, logger, httpService, metricsService)).toThrow(
				'REDIS_URI is not set'
			);
			configSpy.mockRestore();
		});
	});

	describe('send', () => {
		describe('when client is not connected to WS', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const clientMessageMock = 'test-message';

				const closeConSpy = jest.spyOn(service, 'closeConn').mockReturnValueOnce();
				const sendSpy = jest.spyOn(service, 'send');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const byteArray = new TextEncoder().encode(clientMessageMock);

				return {
					closeConSpy,
					sendSpy,
					doc,
					byteArray,
				};
			};

			it('should throw error for send message', async () => {
				const { closeConSpy, sendSpy, doc, byteArray } = await setup();

				service.send(doc, ws, byteArray);

				expect(sendSpy).toThrow();
				expect(sendSpy).toHaveBeenCalledWith(doc, ws, byteArray);
				expect(closeConSpy).toHaveBeenCalled();
				ws.close();
				sendSpy.mockRestore();
			});
		});

		describe('when websocket has ready state different than Open (1) or Connecting (0)', () => {
			const setup = () => {
				const clientMessageMock = 'test-message';
				const closeConSpy = jest.spyOn(service, 'closeConn');
				const sendSpy = jest.spyOn(service, 'send');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const socketMock = TldrawWsFactory.createWebsocket(3);
				const byteArray = new TextEncoder().encode(clientMessageMock);

				return {
					closeConSpy,
					sendSpy,
					doc,
					socketMock,
					byteArray,
				};
			};

			it('should close connection', () => {
				const { closeConSpy, sendSpy, doc, socketMock, byteArray } = setup();

				service.send(doc, socketMock, byteArray);

				expect(sendSpy).toHaveBeenCalledWith(doc, socketMock, byteArray);
				expect(sendSpy).toHaveBeenCalledTimes(1);
				expect(closeConSpy).toHaveBeenCalled();
				closeConSpy.mockRestore();
				sendSpy.mockRestore();
			});
		});

		describe('when websocket has ready state Open (0)', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const clientMessageMock = 'test-message';

				const sendSpy = jest.spyOn(service, 'send');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const socketMock = TldrawWsFactory.createWebsocket(0);
				doc.connections.set(socketMock, new Set());
				const encoder = encoding.createEncoder();
				encoding.writeVarUint(encoder, 2);
				const updateByteArray = new TextEncoder().encode(clientMessageMock);
				encoding.writeVarUint8Array(encoder, updateByteArray);
				const msg = encoding.toUint8Array(encoder);

				return {
					sendSpy,
					doc,
					msg,
					socketMock,
				};
			};

			it('should call send in updateHandler', async () => {
				const { sendSpy, doc, msg, socketMock } = await setup();

				service.updateHandler(msg, socketMock, doc);

				expect(sendSpy).toHaveBeenCalled();
				ws.close();
				sendSpy.mockRestore();
			});
		});

		describe('when received message of specific type', () => {
			const setup = async (messageValues: number[]) => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const sendSpy = jest.spyOn(service, 'send');
				const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate');
				const syncProtocolUpdateSpy = jest
					.spyOn(SyncProtocols, 'readSyncMessage')
					.mockImplementationOnce((dec, enc) => {
						enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
						return 1;
					});
				const doc = new WsSharedDocDo('TEST');
				const { msg } = createMessage(messageValues);

				return {
					sendSpy,
					applyAwarenessUpdateSpy,
					syncProtocolUpdateSpy,
					doc,
					msg,
				};
			};

			it('should call send method when received message of type SYNC', async () => {
				const { sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([0, 1]);

				service.messageHandler(ws, doc, msg);

				expect(sendSpy).toHaveBeenCalledTimes(1);
				ws.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
			});

			it('should not call send method when received message of type AWARENESS', async () => {
				const { sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([1, 1, 0]);

				service.messageHandler(ws, doc, msg);

				expect(sendSpy).toHaveBeenCalledTimes(0);
				expect(applyAwarenessUpdateSpy).toHaveBeenCalledTimes(1);
				ws.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
			});

			it('should do nothing when received message unknown type', async () => {
				const { sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([2]);

				service.messageHandler(ws, doc, msg);

				expect(sendSpy).toHaveBeenCalledTimes(0);
				expect(applyAwarenessUpdateSpy).toHaveBeenCalledTimes(0);
				ws.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
			});
		});

		describe('when error is thrown during receiving message', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);

				const sendSpy = jest.spyOn(service, 'send');
				jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementationOnce(() => {
					throw new Error('error');
				});
				const doc = new WsSharedDocDo('TEST');
				const { msg } = createMessage([0]);

				return {
					sendSpy,
					doc,
					msg,
				};
			};

			it('should not call send method', async () => {
				const { sendSpy, doc, msg } = await setup();

				service.messageHandler(ws, doc, msg);

				expect(sendSpy).toHaveBeenCalledTimes(0);
				ws.close();
				sendSpy.mockRestore();
			});
		});

		describe('when awareness states (clients) size is greater then one', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const doc = new WsSharedDocDo('TEST');
				doc.awareness.states = new Map();
				doc.awareness.states.set(1, ['test1']);
				doc.awareness.states.set(2, ['test2']);

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const sendSpy = jest.spyOn(service, 'send');
				const getYDocSpy = jest.spyOn(service, 'getYDoc').mockReturnValueOnce(doc);
				const { msg } = createMessage([0]);
				jest.spyOn(AwarenessProtocol, 'encodeAwarenessUpdate').mockReturnValueOnce(msg);

				return {
					messageHandlerSpy,
					sendSpy,
					getYDocSpy,
				};
			};

			it('should send to every client', async () => {
				const { messageHandlerSpy, sendSpy, getYDocSpy } = await setup();

				service.setupWSConnection(ws, 'TEST');

				expect(sendSpy).toHaveBeenCalledTimes(2);
				ws.close();
				messageHandlerSpy.mockRestore();
				sendSpy.mockRestore();
				getYDocSpy.mockRestore();
			});
		});
	});

	describe('closeConn', () => {
		describe('when there is no error', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);

				const flushDocumentSpy = jest.spyOn(boardRepo, 'flushDocument').mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'unsubscribe').mockResolvedValueOnce(1);
				const closeConnSpy = jest.spyOn(service, 'closeConn');

				return {
					flushDocumentSpy,
					redisUnsubscribeSpy,
					closeConnSpy,
				};
			};

			it('should close connection', async () => {
				const { closeConnSpy } = await setup();

				service.setupWSConnection(ws, 'TEST');
				await delay(10);

				expect(closeConnSpy).toHaveBeenCalled();
				ws.close();
				closeConnSpy.mockRestore();
			});
		});

		describe('when trying to close already closed connection', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);

				jest.spyOn(ws, 'close').mockImplementationOnce(() => {
					throw new Error('some error');
				});
			};

			it('should throw error', async () => {
				await setup();
				try {
					const doc = TldrawWsFactory.createWsSharedDocDo();
					service.closeConn(doc, ws);
				} catch (err) {
					expect(err).toBeDefined();
				}

				ws.close();
			});
		});

		describe('when ping failed', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const closeConnSpy = jest.spyOn(service, 'closeConn');
				jest.spyOn(ws, 'ping').mockImplementationOnce(() => {
					throw new Error('error');
				});

				return {
					messageHandlerSpy,
					closeConnSpy,
				};
			};

			it('should close connection', async () => {
				const { messageHandlerSpy, closeConnSpy } = await setup();

				service.setupWSConnection(ws, 'TEST');
				await delay(10);

				expect(closeConnSpy).toHaveBeenCalled();
				ws.close();
				messageHandlerSpy.mockRestore();
				closeConnSpy.mockRestore();
			});
		});

		describe('when flushDocument failed', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const flushDocumentSpy = jest.spyOn(boardRepo, 'flushDocument').mockRejectedValueOnce(new Error('error'));
				const errorLogSpy = jest.spyOn(logger, 'warning');

				return {
					flushDocumentSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { flushDocumentSpy, errorLogSpy } = await setup();

				service.setupWSConnection(ws, 'TEST');
				await delay(10);

				expect(flushDocumentSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				ws.close();
			});
		});
	});

	describe('updateHandler', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl);

			const sendSpy = jest.spyOn(service, 'send').mockReturnValueOnce();
			const errorLogSpy = jest.spyOn(logger, 'warning');

			const doc = TldrawWsFactory.createWsSharedDocDo();
			const socketMock = TldrawWsFactory.createWebsocket(0);
			doc.connections.set(socketMock, new Set());
			const msg = new Uint8Array([0]);

			return {
				doc,
				sendSpy,
				socketMock,
				msg,
				errorLogSpy,
			};
		};

		it('should call send method', async () => {
			const { sendSpy, doc, socketMock, msg } = await setup();

			service.updateHandler(msg, socketMock, doc);

			expect(sendSpy).toHaveBeenCalled();
			ws.close();
		});

		it('should log error when publish to Redis throws', async () => {
			jest.spyOn(Ioredis.Redis.prototype, 'publish').mockRejectedValueOnce(new Error('error'));
			const { doc, socketMock, msg, errorLogSpy } = await setup();

			service.updateHandler(msg, socketMock, doc);
			await delay(10);

			expect(errorLogSpy).toHaveBeenCalled();
			ws.close();
		});
	});

	describe('messageHandler', () => {
		describe('when message is received', () => {
			const setup = async (messageValues: number[]) => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const errorLogSpy = jest.spyOn(logger, 'warning');
				const messageHandlerSpy = jest.spyOn(service, 'messageHandler');
				const readSyncMessageSpy = jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementationOnce((dec, enc) => {
					enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
					return 1;
				});
				const { msg } = createMessage(messageValues);

				return {
					msg,
					messageHandlerSpy,
					readSyncMessageSpy,
					errorLogSpy,
				};
			};

			it('should handle message', async () => {
				const { messageHandlerSpy, msg, readSyncMessageSpy } = await setup([0, 1]);

				service.setupWSConnection(ws, 'TEST');
				ws.emit('message', msg);

				expect(messageHandlerSpy).toHaveBeenCalledTimes(1);
				ws.close();
				messageHandlerSpy.mockRestore();
				readSyncMessageSpy.mockRestore();
			});

			it('should log error when publish to Redis throws', async () => {
				jest.spyOn(Ioredis.Redis.prototype, 'publish').mockRejectedValueOnce(new Error('error'));
				const { msg, errorLogSpy } = await setup([1, 1]);

				service.setupWSConnection(ws, 'TEST');
				ws.emit('message', msg);
				await delay(10);

				expect(errorLogSpy).toHaveBeenCalled();
				ws.close();
			});
		});
	});

	describe('getYDoc', () => {
		describe('when getting yDoc by name', () => {
			it('should assign to service docs map and return instance', () => {
				const docName = 'get-test';
				const doc = service.getYDoc(docName);

				expect(doc).toBeInstanceOf(WsSharedDocDo);
				expect(service.docs.get(docName)).not.toBeUndefined();
			});

			describe('when subscribing to redis channel', () => {
				const setup = () => {
					const redisSubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'subscribe');
					const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');
					const errorLogSpy = jest.spyOn(logger, 'warning');

					return {
						redisOnSpy,
						redisSubscribeSpy,
						errorLogSpy,
					};
				};

				it('should register new listener', async () => {
					const { redisOnSpy, redisSubscribeSpy } = setup();
					redisSubscribeSpy.mockResolvedValueOnce(1);

					const doc = service.getYDoc('test-redis');
					await delay(20);

					expect(doc).toBeDefined();
					expect(redisOnSpy).toHaveBeenCalled();
				});

				it('should log error when failed', async () => {
					const { errorLogSpy, redisSubscribeSpy } = setup();
					redisSubscribeSpy.mockRejectedValueOnce(new Error('error'));

					const doc = service.getYDoc('test-redis-fail');
					await delay(20);

					expect(doc).toBeDefined();
					expect(errorLogSpy).toHaveBeenCalled();
				});
			});

			describe('when updating document', () => {
				const setup = () => {
					const updateDocSpy = jest.spyOn(boardRepo, 'updateDocument');
					const errorLogSpy = jest.spyOn(logger, 'warning');

					return {
						updateDocSpy,
						errorLogSpy,
					};
				};

				it('should log error when failed', async () => {
					const { errorLogSpy, updateDocSpy } = setup();
					updateDocSpy.mockRejectedValueOnce(new Error('error'));

					const doc = service.getYDoc('test-update-fail');
					await delay(20);

					expect(doc).toBeDefined();
					expect(errorLogSpy).toHaveBeenCalled();
				});
			});
		});
	});

	describe('redisMessageHandler', () => {
		const setup = () => {
			const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();
			const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate').mockReturnValueOnce();

			const doc = new WsSharedDocDo('TEST');
			doc.awarenessChannel = 'TEST-AWARENESS';

			return {
				doc,
				applyUpdateSpy,
				applyAwarenessUpdateSpy,
			};
		};

		describe('when channel name is the same as docName', () => {
			it('should call applyUpdate', () => {
				const { doc, applyUpdateSpy } = setup();

				service.redisMessageHandler(Buffer.from('TEST'), Buffer.from('message'), doc);

				expect(applyUpdateSpy).toHaveBeenCalled();
			});
		});

		describe('when channel name is the same as docAwarenessChannel name', () => {
			it('should call applyAwarenessUpdate', () => {
				const { doc, applyAwarenessUpdateSpy } = setup();

				service.redisMessageHandler(Buffer.from('TEST-AWARENESS'), Buffer.from('message'), doc);

				expect(applyAwarenessUpdateSpy).toHaveBeenCalled();
			});
		});
	});

	describe('awarenessUpdateHandler', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl);

			class MockAwareness {
				on = jest.fn();
			}

			const doc = new WsSharedDocDo('TEST');
			doc.awareness = new MockAwareness() as unknown as AwarenessProtocol.Awareness;
			const awarenessMetaMock = new Map<number, { clock: number; lastUpdated: number }>();
			awarenessMetaMock.set(1, { clock: 11, lastUpdated: 21 });
			awarenessMetaMock.set(2, { clock: 12, lastUpdated: 22 });
			awarenessMetaMock.set(3, { clock: 13, lastUpdated: 23 });
			const awarenessStatesMock = new Map<number, { [x: string]: unknown }>();
			awarenessStatesMock.set(1, { updating: '21' });
			awarenessStatesMock.set(2, { updating: '22' });
			awarenessStatesMock.set(3, { updating: '23' });
			doc.awareness.states = awarenessStatesMock;
			doc.awareness.meta = awarenessMetaMock;

			const sendSpy = jest.spyOn(service, 'send').mockReturnValue();

			const mockIDs = new Set<number>();
			const mockConns = new Map<WebSocket, Set<number>>();
			mockConns.set(ws, mockIDs);
			doc.connections = mockConns;

			return {
				sendSpy,
				doc,
				mockIDs,
				mockConns,
			};
		};

		describe('when adding two clients states', () => {
			it('should have two registered clients states', async () => {
				const { sendSpy, doc, mockIDs } = await setup();
				const awarenessUpdate = {
					added: [1, 3],
					updated: [],
					removed: [],
				};

				service.awarenessUpdateHandler(awarenessUpdate, ws, doc);

				expect(mockIDs.size).toBe(2);
				expect(mockIDs.has(1)).toBe(true);
				expect(mockIDs.has(3)).toBe(true);
				expect(mockIDs.has(2)).toBe(false);
				expect(sendSpy).toBeCalled();
				ws.close();
				sendSpy.mockRestore();
			});
		});

		describe('when removing one of two existing clients states', () => {
			it('should have one registered client state', async () => {
				const { sendSpy, doc, mockIDs } = await setup();
				let awarenessUpdate: { added: number[]; updated: number[]; removed: number[] } = {
					added: [1, 3],
					updated: [],
					removed: [],
				};

				service.awarenessUpdateHandler(awarenessUpdate, ws, doc);
				awarenessUpdate = {
					added: [],
					updated: [],
					removed: [1],
				};
				service.awarenessUpdateHandler(awarenessUpdate, ws, doc);

				expect(mockIDs.size).toBe(1);
				expect(mockIDs.has(1)).toBe(false);
				expect(mockIDs.has(3)).toBe(true);
				expect(sendSpy).toBeCalled();
				ws.close();
				sendSpy.mockRestore();
			});
		});

		describe('when updating client state', () => {
			it('should not change number of states', async () => {
				const { sendSpy, doc, mockIDs } = await setup();
				let awarenessUpdate: { added: number[]; updated: number[]; removed: number[] } = {
					added: [1],
					updated: [],
					removed: [],
				};

				service.awarenessUpdateHandler(awarenessUpdate, ws, doc);
				awarenessUpdate = {
					added: [],
					updated: [1],
					removed: [],
				};
				service.awarenessUpdateHandler(awarenessUpdate, ws, doc);

				expect(mockIDs.size).toBe(1);
				expect(mockIDs.has(1)).toBe(true);
				expect(sendSpy).toBeCalled();

				ws.close();
				sendSpy.mockRestore();
			});
		});
	});

	describe('authorizeConnection', () => {
		it('should call properly method', async () => {
			const params = { drawingName: 'drawingName', token: 'token' };
			const response: AxiosResponse<null> = axiosResponseFactory.build({
				status: 200,
			});

			httpService.get.mockReturnValueOnce(of(response));

			await expect(service.authorizeConnection(params.drawingName, params.token)).resolves.not.toThrow();
			httpService.get.mockRestore();
		});

		it('should properly setup REST GET call params', async () => {
			const params = { drawingName: 'drawingName', token: 'token' };
			const response: AxiosResponse<null> = axiosResponseFactory.build({
				status: 200,
			});
			const expectedUrl = 'http://localhost:3030/api/v3/elements/drawingName/permission';
			const expectedHeaders = {
				headers: {
					Accept: 'Application/json',
					Authorization: `Bearer ${params.token}`,
				},
			};
			httpService.get.mockReturnValueOnce(of(response));

			await service.authorizeConnection(params.drawingName, params.token);

			expect(httpService.get).toHaveBeenCalledWith(expectedUrl, expectedHeaders);
			httpService.get.mockRestore();
		});

		it('should throw error for http response', async () => {
			const params = { drawingName: 'drawingName', token: 'token' };
			const error = new Error('unknown error');
			httpService.get.mockReturnValueOnce(throwError(() => error));

			await expect(service.authorizeConnection(params.drawingName, params.token)).rejects.toThrow();
			httpService.get.mockRestore();
		});

		it('should throw error for lack of token', async () => {
			const params = { drawingName: 'drawingName', token: 'token' };

			await expect(service.authorizeConnection(params.drawingName, '')).rejects.toThrow();
			httpService.get.mockRestore();
		});
	});
});
