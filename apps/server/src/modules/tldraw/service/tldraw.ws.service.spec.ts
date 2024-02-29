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
import { WebSocketReadyStateEnum } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { YMap } from 'yjs/dist/src/types/YMap';
import { TldrawRedisFactory } from '../redis';
import { TldrawWs } from '../controller';
import { TldrawDrawing } from '../entities';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from '../repo';
import { TestConnection, tldrawTestConfig } from '../testing';
import { WsSharedDocDo } from '../domain';
import { MetricsService } from '../metrics';
import { TldrawWsService } from '.';
import { TldrawAsset, TldrawShape, TldrawShapeType } from '../types';

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
	let service: TldrawWsService;
	let boardRepo: TldrawBoardRepo;
	let logger: DeepMocked<Logger>;

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
				TldrawRedisFactory,
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

		service = testingModule.get(TldrawWsService);
		boardRepo = testingModule.get(TldrawBoardRepo);
		logger = testingModule.get(Logger);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
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
	});

	describe('send', () => {
		describe('when client is not connected to WS', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const clientMessageMock = 'test-message';

				const closeConSpy = jest.spyOn(service, 'closeConn').mockResolvedValueOnce();
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

		describe('when client is not connected to WS and close connection throws error', () => {
			const setup = () => {
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
				const clientMessageMock = 'test-message';

				const closeConSpy = jest.spyOn(service, 'closeConn').mockRejectedValue(new Error('error'));
				jest.spyOn(socketMock, 'send').mockImplementation((...args: unknown[]) => {
					args.forEach((arg) => {
						if (typeof arg === 'function') {
							arg(new Error('error'));
						}
					});
				});
				const sendSpy = jest.spyOn(service, 'send');
				const errorLogSpy = jest.spyOn(logger, 'warning');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const byteArray = new TextEncoder().encode(clientMessageMock);

				return {
					socketMock,
					closeConSpy,
					errorLogSpy,
					sendSpy,
					doc,
					byteArray,
				};
			};

			it('should log error', async () => {
				const { socketMock, closeConSpy, errorLogSpy, sendSpy, doc, byteArray } = setup();

				service.send(doc, socketMock, byteArray);

				await delay(100);

				expect(sendSpy).toHaveBeenCalledWith(doc, socketMock, byteArray);
				expect(closeConSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				closeConSpy.mockRestore();
				sendSpy.mockRestore();
			});
		});

		describe('when web socket has ready state CLOSED and close connection throws error', () => {
			const setup = () => {
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.CLOSED);
				const clientMessageMock = 'test-message';

				const closeConSpy = jest.spyOn(service, 'closeConn').mockRejectedValue(new Error('error'));
				const sendSpy = jest.spyOn(service, 'send');
				const errorLogSpy = jest.spyOn(logger, 'warning');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const byteArray = new TextEncoder().encode(clientMessageMock);

				return {
					socketMock,
					closeConSpy,
					errorLogSpy,
					sendSpy,
					doc,
					byteArray,
				};
			};

			it('should log error', async () => {
				const { socketMock, closeConSpy, errorLogSpy, sendSpy, doc, byteArray } = setup();

				service.send(doc, socketMock, byteArray);

				await delay(100);

				expect(sendSpy).toHaveBeenCalledWith(doc, socketMock, byteArray);
				expect(closeConSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				closeConSpy.mockRestore();
				sendSpy.mockRestore();
			});
		});

		describe('when websocket has ready state different than Open (1) or Connecting (0)', () => {
			const setup = () => {
				const clientMessageMock = 'test-message';
				const closeConSpy = jest.spyOn(service, 'closeConn');
				const sendSpy = jest.spyOn(service, 'send');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.CLOSED);
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
				jest.spyOn(Ioredis.Redis.prototype, 'publish').mockResolvedValueOnce(1);
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
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

		describe('when received message of type specific type', () => {
			const setup = async (messageValues: number[]) => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const errorLogSpy = jest.spyOn(logger, 'warning');
				const publishSpy = jest.spyOn(Ioredis.Redis.prototype, 'publish');
				const sendSpy = jest.spyOn(service, 'send');
				const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate');
				const syncProtocolUpdateSpy = jest
					.spyOn(SyncProtocols, 'readSyncMessage')
					.mockImplementationOnce((_dec, enc) => {
						enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
						return 1;
					});
				const doc = new WsSharedDocDo('TEST');
				const { msg } = createMessage(messageValues);

				return {
					sendSpy,
					errorLogSpy,
					publishSpy,
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

				expect(sendSpy).not.toHaveBeenCalled();
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

		describe('when publishing AWARENESS has errors', () => {
			const setup = async (messageValues: number[]) => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const errorLogSpy = jest.spyOn(logger, 'warning');
				const publishSpy = jest
					.spyOn(Ioredis.Redis.prototype, 'publish')
					.mockImplementationOnce((_channel, _message, cb) => {
						if (cb) {
							cb(new Error('error'));
						}
						return Promise.resolve(0);
					});
				const sendSpy = jest.spyOn(service, 'send');
				const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate');
				const syncProtocolUpdateSpy = jest
					.spyOn(SyncProtocols, 'readSyncMessage')
					.mockImplementationOnce((_dec, enc) => {
						enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
						return 1;
					});
				const doc = new WsSharedDocDo('TEST');
				const { msg } = createMessage(messageValues);

				return {
					sendSpy,
					errorLogSpy,
					publishSpy,
					applyAwarenessUpdateSpy,
					syncProtocolUpdateSpy,
					doc,
					msg,
				};
			};

			it('should log error', async () => {
				const { publishSpy, errorLogSpy, sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } =
					await setup([1, 1, 0]);

				service.messageHandler(ws, doc, msg);

				expect(sendSpy).not.toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				ws.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
				publishSpy.mockRestore();
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

				expect(() => service.messageHandler(ws, doc, msg)).toThrow('error');

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
				const sendSpy = jest.spyOn(service, 'send').mockImplementation(() => {});
				const getYDocSpy = jest.spyOn(service, 'getYDoc').mockResolvedValueOnce(doc);
				const closeConnSpy = jest.spyOn(service, 'closeConn').mockResolvedValue();
				const { msg } = createMessage([0]);
				jest.spyOn(AwarenessProtocol, 'encodeAwarenessUpdate').mockReturnValueOnce(msg);

				return {
					messageHandlerSpy,
					sendSpy,
					getYDocSpy,
					closeConnSpy,
				};
			};

			it('should send to every client', async () => {
				const { messageHandlerSpy, sendSpy, getYDocSpy, closeConnSpy } = await setup();

				await service.setupWSConnection(ws, 'TEST');
				await delay(20);
				ws.emit('pong');

				await delay(20);

				expect(sendSpy).toHaveBeenCalledTimes(3);
				ws.close();
				messageHandlerSpy.mockRestore();
				sendSpy.mockRestore();
				getYDocSpy.mockRestore();
				closeConnSpy.mockRestore();
			});
		});
	});

	describe('on websocket error', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl, 'TEST');
			const errorLogSpy = jest.spyOn(logger, 'warning');

			return {
				errorLogSpy,
			};
		};

		it('should log error', async () => {
			const { errorLogSpy } = await setup();

			await service.setupWSConnection(ws, 'TEST');
			ws.emit('error', new Error('error'));

			expect(errorLogSpy).toHaveBeenCalled();
			ws.close();
		});
	});

	describe('closeConn', () => {
		describe('when there is no error', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);

				const flushDocumentSpy = jest.spyOn(boardRepo, 'compressDocument').mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'unsubscribe').mockResolvedValueOnce(1);
				const closeConnSpy = jest.spyOn(service, 'closeConn');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					flushDocumentSpy,
					redisUnsubscribeSpy,
					closeConnSpy,
				};
			};

			it('should close connection', async () => {
				const { flushDocumentSpy, redisUnsubscribeSpy, closeConnSpy } = await setup();

				await service.setupWSConnection(ws, 'TEST');

				expect(closeConnSpy).toHaveBeenCalled();
				ws.close();
				closeConnSpy.mockRestore();
				flushDocumentSpy.mockRestore();
				redisUnsubscribeSpy.mockRestore();
			});
		});

		describe('when close connection fails', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);

				const flushDocumentSpy = jest.spyOn(boardRepo, 'compressDocument').mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'unsubscribe').mockResolvedValueOnce(1);
				const closeConnSpy = jest.spyOn(service, 'closeConn').mockRejectedValueOnce(new Error('error'));
				const errorLogSpy = jest.spyOn(logger, 'warning');
				const sendSpyError = jest.spyOn(service, 'send').mockReturnValue();
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					flushDocumentSpy,
					redisUnsubscribeSpy,
					closeConnSpy,
					errorLogSpy,
					sendSpyError,
				};
			};

			it('should log error', async () => {
				const { flushDocumentSpy, redisUnsubscribeSpy, closeConnSpy, errorLogSpy, sendSpyError } = await setup();

				await service.setupWSConnection(ws, 'TEST');

				await delay(100);

				expect(closeConnSpy).toHaveBeenCalled();

				ws.close();
				await delay(100);
				expect(errorLogSpy).toHaveBeenCalled();
				flushDocumentSpy.mockRestore();
				redisUnsubscribeSpy.mockRestore();
				closeConnSpy.mockRestore();
				sendSpyError.mockRestore();
			});
		});

		describe('when unsubscribing from Redis fails', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);
				const doc = TldrawWsFactory.createWsSharedDocDo();
				doc.connections.set(ws, new Set<number>());

				const flushDocumentSpy = jest.spyOn(boardRepo, 'compressDocument').mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest
					.spyOn(Ioredis.Redis.prototype, 'unsubscribe')
					.mockImplementationOnce((...args: unknown[]) => {
						args.forEach((arg) => {
							if (typeof arg === 'function') {
								arg(new Error('error'));
							}
						});
						return Promise.resolve(0);
					});
				const errorLogSpy = jest.spyOn(logger, 'warning');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					doc,
					flushDocumentSpy,
					redisUnsubscribeSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { doc, errorLogSpy, flushDocumentSpy, redisUnsubscribeSpy } = await setup();

				await service.closeConn(doc, ws);

				await delay(100);

				expect(redisUnsubscribeSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				flushDocumentSpy.mockRestore();
				redisUnsubscribeSpy.mockRestore();
			});
		});

		describe('when unsubscribing from Redis throw error', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);
				const doc = TldrawWsFactory.createWsSharedDocDo();
				doc.connections.set(ws, new Set<number>());

				const flushDocumentSpy = jest.spyOn(boardRepo, 'compressDocument').mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest
					.spyOn(Ioredis.Redis.prototype, 'unsubscribe')
					.mockRejectedValue(new Error('error'));
				const closeConnSpy = jest.spyOn(service, 'closeConn');
				const errorLogSpy = jest.spyOn(logger, 'warning');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					doc,
					flushDocumentSpy,
					redisUnsubscribeSpy,
					closeConnSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { doc, errorLogSpy, flushDocumentSpy, redisUnsubscribeSpy, closeConnSpy } = await setup();

				await service.closeConn(doc, ws);
				await delay(200);

				expect(redisUnsubscribeSpy).toHaveBeenCalled();
				expect(closeConnSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				closeConnSpy.mockRestore();
				flushDocumentSpy.mockRestore();
				redisUnsubscribeSpy.mockRestore();
			});
		});

		describe('when updating new document fails', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);

				const closeConnSpy = jest.spyOn(service, 'closeConn');
				const errorLogSpy = jest.spyOn(logger, 'warning');
				const updateDocSpy = jest.spyOn(boardRepo, 'loadDocument');
				const sendSpy = jest.spyOn(service, 'send').mockImplementation(() => {});

				return {
					closeConnSpy,
					errorLogSpy,
					updateDocSpy,
					sendSpy,
				};
			};

			it('should log error', async () => {
				const { sendSpy, errorLogSpy, updateDocSpy, closeConnSpy } = await setup();
				updateDocSpy.mockRejectedValueOnce(new Error('error'));

				await expect(service.setupWSConnection(ws, 'test-update-fail')).rejects.toThrow('error');
				ws.close();

				expect(errorLogSpy).toHaveBeenCalled();
				closeConnSpy.mockRestore();
				sendSpy.mockRestore();
				ws.close();
			});
		});

		describe('when pong not received', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const closeConnSpy = jest.spyOn(service, 'closeConn').mockImplementation(() => Promise.resolve());
				const pingSpy = jest.spyOn(ws, 'ping').mockImplementationOnce(() => {});
				const sendSpy = jest.spyOn(service, 'send').mockImplementation(() => {});
				const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					messageHandlerSpy,
					closeConnSpy,
					pingSpy,
					sendSpy,
					clearIntervalSpy,
				};
			};

			it('should close connection', async () => {
				const { messageHandlerSpy, closeConnSpy, pingSpy, sendSpy, clearIntervalSpy } = await setup();

				await service.setupWSConnection(ws, 'TEST');

				await delay(20);

				expect(closeConnSpy).toHaveBeenCalled();
				expect(clearIntervalSpy).toHaveBeenCalled();
				ws.close();
				messageHandlerSpy.mockRestore();
				pingSpy.mockRestore();
				closeConnSpy.mockRestore();
				sendSpy.mockRestore();
				clearIntervalSpy.mockRestore();
			});
		});

		describe('when pong not received and close connection fails', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const closeConnSpy = jest.spyOn(service, 'closeConn').mockRejectedValue(new Error('error'));
				const pingSpy = jest.spyOn(ws, 'ping').mockImplementation(() => {});
				const sendSpy = jest.spyOn(service, 'send').mockImplementation(() => {});
				const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
				const errorLogSpy = jest.spyOn(logger, 'warning');
				jest.spyOn(boardRepo, 'loadDocument').mockImplementationOnce(() => Promise.resolve());
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					messageHandlerSpy,
					closeConnSpy,
					pingSpy,
					sendSpy,
					clearIntervalSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { messageHandlerSpy, closeConnSpy, pingSpy, sendSpy, clearIntervalSpy, errorLogSpy } = await setup();

				await service.setupWSConnection(ws, 'TEST');

				await delay(200);

				expect(closeConnSpy).toHaveBeenCalled();
				expect(clearIntervalSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				ws.close();
				messageHandlerSpy.mockRestore();
				pingSpy.mockRestore();
				closeConnSpy.mockRestore();
				sendSpy.mockRestore();
				clearIntervalSpy.mockRestore();
			});
		});

		describe('when synchronising assets', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const doc = new WsSharedDocDo('TEST');
				doc.connections.set(ws, new Set<number>());
				const shapes: YMap<TldrawShape> = doc.getMap('shapes');
				const assets: YMap<TldrawAsset> = doc.getMap('assets');
				shapes.set('shape1', { id: 'shape1', type: TldrawShapeType.Image, assetId: 'asset1' });
				shapes.set('shape2', { id: 'shape2', type: TldrawShapeType.Draw });
				assets.set('asset1', {
					id: 'asset1',
					type: TldrawShapeType.Image,
					name: 'asset1.jpg',
					src: '/filerecordid1/file1.jpg',
				});
				assets.set('asset2', {
					id: 'asset2',
					type: TldrawShapeType.Image,
					name: 'asset2.jpg',
					src: '/filerecordid2/file2.jpg',
				});

				return {
					doc,
					assets,
				};
			};

			it('should remove unused assets from document', async () => {
				const { doc, assets } = await setup();

				const initialSize = assets.size;
				await service.closeConn(doc, ws);
				const finalSize = assets.size;

				expect(initialSize).toBe(2);
				expect(finalSize).toBe(1);
				ws.close();
			});
		});

		describe('when flushDocument failed', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				doc.connections.set(ws, new Set<number>());

				const flushDocumentSpy = jest.spyOn(boardRepo, 'compressDocument');
				const errorLogSpy = jest.spyOn(logger, 'warning');

				return {
					doc,
					flushDocumentSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { doc, flushDocumentSpy, errorLogSpy } = await setup();
				flushDocumentSpy.mockRejectedValueOnce(new Error('error'));

				await expect(service.closeConn(doc, ws)).rejects.toThrow('error');

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
			const publishSpy = jest.spyOn(Ioredis.Redis.prototype, 'publish').mockResolvedValueOnce(1);

			const doc = TldrawWsFactory.createWsSharedDocDo();
			const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
			doc.connections.set(socketMock, new Set());
			const msg = new Uint8Array([0]);

			return {
				doc,
				sendSpy,
				socketMock,
				msg,
				errorLogSpy,
				publishSpy,
			};
		};

		it('should call send method', async () => {
			const { sendSpy, doc, socketMock, msg } = await setup();

			service.updateHandler(msg, socketMock, doc);

			expect(sendSpy).toHaveBeenCalled();
			ws.close();
		});
	});

	describe('databaseUpdateHandler', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl);

			const storeUpdateSpy = jest.spyOn(boardRepo, 'storeUpdate').mockResolvedValueOnce();

			return {
				storeUpdateSpy,
			};
		};

		it('should call send method', async () => {
			const { storeUpdateSpy } = await setup();

			await service.databaseUpdateHandler('test', new Uint8Array());

			expect(storeUpdateSpy).toHaveBeenCalled();
			ws.close();
		});
	});

	describe('when publish to Redis has errors', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl);

			const sendSpy = jest.spyOn(service, 'send').mockReturnValueOnce();
			const errorLogSpy = jest.spyOn(logger, 'warning');
			const publishSpy = jest
				.spyOn(Ioredis.Redis.prototype, 'publish')
				.mockImplementationOnce((_channel, _message, cb) => {
					if (cb) {
						cb(new Error('error'));
					}
					return Promise.resolve(0);
				});

			const doc = TldrawWsFactory.createWsSharedDocDo();
			const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
			doc.connections.set(socketMock, new Set());
			const msg = new Uint8Array([0]);

			return {
				doc,
				sendSpy,
				socketMock,
				msg,
				errorLogSpy,
				publishSpy,
			};
		};

		it('should log error', async () => {
			const { doc, socketMock, msg, errorLogSpy, publishSpy } = await setup();

			service.updateHandler(msg, socketMock, doc);

			expect(errorLogSpy).toHaveBeenCalled();
			ws.close();
			publishSpy.mockRestore();
		});
	});

	describe('when publish to Redis throws errors', () => {
		const setup = async () => {
			ws = await TestConnection.setupWs(wsUrl);

			const sendSpy = jest.spyOn(service, 'send').mockReturnValueOnce();
			const errorLogSpy = jest.spyOn(logger, 'warning');
			const publishSpy = jest.spyOn(Ioredis.Redis.prototype, 'publish').mockRejectedValueOnce(new Error('error'));

			const doc = TldrawWsFactory.createWsSharedDocDo();
			const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
			doc.connections.set(socketMock, new Set());
			const msg = new Uint8Array([0]);

			return {
				doc,
				sendSpy,
				socketMock,
				msg,
				errorLogSpy,
				publishSpy,
			};
		};

		it('should log error', async () => {
			const { doc, socketMock, msg, errorLogSpy, publishSpy } = await setup();

			service.updateHandler(msg, socketMock, doc);

			await delay(20);

			expect(errorLogSpy).toHaveBeenCalled();
			ws.close();
			publishSpy.mockRestore();
		});
	});

	describe('messageHandler', () => {
		describe('when message is received', () => {
			const setup = async (messageValues: number[]) => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const errorLogSpy = jest.spyOn(logger, 'warning');
				const messageHandlerSpy = jest.spyOn(service, 'messageHandler');
				const readSyncMessageSpy = jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementationOnce((_dec, enc) => {
					enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
					return 1;
				});
				const publishSpy = jest.spyOn(Ioredis.Redis.prototype, 'publish');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});
				const { msg } = createMessage(messageValues);

				return {
					msg,
					messageHandlerSpy,
					readSyncMessageSpy,
					errorLogSpy,
					publishSpy,
				};
			};

			it('should handle message', async () => {
				const { messageHandlerSpy, msg, readSyncMessageSpy, publishSpy } = await setup([0, 1]);
				publishSpy.mockResolvedValueOnce(1);

				await service.setupWSConnection(ws, 'TEST');
				ws.emit('message', msg);

				await delay(20);

				expect(messageHandlerSpy).toHaveBeenCalledTimes(1);
				ws.close();
				messageHandlerSpy.mockRestore();
				readSyncMessageSpy.mockRestore();
				publishSpy.mockRestore();
			});

			it('should log error when publish to Redis throws', async () => {
				const { errorLogSpy, publishSpy } = await setup([1, 1]);
				publishSpy.mockRejectedValueOnce(new Error('error'));

				await service.setupWSConnection(ws, 'TEST');

				expect(errorLogSpy).toHaveBeenCalled();
				ws.close();
			});
		});
	});

	describe('getYDoc', () => {
		describe('when getting yDoc by name', () => {
			it('should assign to service docs map and return instance', async () => {
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});
				const docName = 'get-test';
				const doc = await service.getYDoc(docName);

				expect(doc).toBeInstanceOf(WsSharedDocDo);
				expect(service.docs.get(docName)).not.toBeUndefined();
			});

			describe('when subscribing to redis channel', () => {
				const setup = () => {
					const redisSubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce(1);
					const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');
					const errorLogSpy = jest.spyOn(logger, 'warning');

					return {
						redisOnSpy,
						redisSubscribeSpy,
						errorLogSpy,
					};
				};

				it('should register new listener', () => {
					const { redisOnSpy, redisSubscribeSpy } = setup();

					const doc = service.getYDoc('test-redis');

					expect(doc).toBeDefined();
					expect(redisOnSpy).toHaveBeenCalled();
					redisSubscribeSpy.mockRestore();
					redisSubscribeSpy.mockRestore();
				});
			});

			describe('when subscribing to redis channel fails', () => {
				const setup = () => {
					const redisSubscribeSpy = jest
						.spyOn(Ioredis.Redis.prototype, 'subscribe')
						.mockImplementationOnce((...args: unknown[]) => {
							args.forEach((arg) => {
								if (typeof arg === 'function') {
									arg(new Error('error'));
								}
							});
							return Promise.resolve(0);
						});
					const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');
					const errorLogSpy = jest.spyOn(logger, 'warning');

					return {
						redisOnSpy,
						redisSubscribeSpy,
						errorLogSpy,
					};
				};

				it('should log error', async () => {
					const { errorLogSpy, redisSubscribeSpy, redisOnSpy } = setup();

					await service.getYDoc('test-redis-fail');

					expect(redisSubscribeSpy).toHaveBeenCalled();
					expect(errorLogSpy).toHaveBeenCalled();
					redisSubscribeSpy.mockRestore();
					redisOnSpy.mockRestore();
				});
			});
		});

		describe('when subscribing to redis channel throws error', () => {
			const setup = () => {
				const redisSubscribeSpy = jest
					.spyOn(Ioredis.Redis.prototype, 'subscribe')
					.mockRejectedValue(new Error('error'));
				const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');
				const errorLogSpy = jest.spyOn(logger, 'warning');

				return {
					redisOnSpy,
					redisSubscribeSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { errorLogSpy, redisSubscribeSpy, redisOnSpy } = setup();

				await service.getYDoc('test-redis-fail-2');

				await delay(500);

				expect(redisSubscribeSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();
				redisSubscribeSpy.mockRestore();
				redisOnSpy.mockRestore();
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

			const doc = new WsSharedDocDo('TEST-AUH');
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
});
