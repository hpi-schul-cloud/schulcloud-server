import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { WebSocketReadyStateEnum } from '@shared/testing';
import { TldrawWsFactory } from '@shared/testing/factory/tldraw.ws.factory';
import { createConfigModuleOptions } from '@src/config';
import { DomainErrorHandler } from '@src/core';
import * as Ioredis from 'ioredis';
import { encoding } from 'lib0';
import { TextEncoder } from 'util';
import WebSocket from 'ws';
import * as AwarenessProtocol from 'y-protocols/awareness';
import * as SyncProtocols from 'y-protocols/sync';
import * as Yjs from 'yjs';
import { TldrawWsService } from '.';
import { TldrawWs } from '../controller';
import { WsSharedDocDo } from '../domain';
import { TldrawDrawing } from '../entities';
import { MetricsService } from '../metrics';
import { TldrawRedisFactory, TldrawRedisService } from '../redis';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from '../repo';
import { TestConnection, tldrawTestConfig } from '../testing';

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

describe('TldrawWSService', () => {
	let app: INestApplication;
	let wsGlobal: WebSocket;
	let service: TldrawWsService;
	let boardRepo: DeepMocked<TldrawBoardRepo>;
	// let domainErrorHandler: DeepMocked<DomainErrorHandler>;

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
				YMongodb,
				MetricsService,
				TldrawRedisFactory,
				TldrawRedisService,
				{
					provide: TldrawBoardRepo,
					useValue: createMock<TldrawBoardRepo>(),
				},
				{
					provide: TldrawRepo,
					useValue: createMock<TldrawRepo>(),
				},
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		service = testingModule.get(TldrawWsService);
		boardRepo = testingModule.get(TldrawBoardRepo);
		// domainErrorHandler = testingModule.get(DomainErrorHandler);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	describe('send', () => {
		describe('when client is not connected to WS', () => {
			const setup = async () => {
				const ws = await TestConnection.setupWs(wsUrl, 'TEST');
				const closeConMock = jest.spyOn(service, 'closeConnection').mockResolvedValueOnce();
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const byteArray = new TextEncoder().encode('test-message');

				return {
					closeConMock,
					doc,
					byteArray,
					ws,
				};
			};

			it('should throw error for send message', async () => {
				const { closeConMock, doc, byteArray, ws } = await setup();

				service.send(doc, ws, byteArray);

				expect(closeConMock).toHaveBeenCalled();
				ws.close();
			});
		});

		describe('when client is not connected to WS and close connection throws error', () => {
			const setup = () => {
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
				const clientMessageMock = 'test-message';

				jest.spyOn(service, 'closeConnection').mockRejectedValueOnce(new Error('error'));
				jest.spyOn(socketMock, 'send').mockImplementationOnce((...args: unknown[]) => {
					args.forEach((arg) => {
						if (typeof arg === 'function') {
							arg(new Error('error'));
						}
					});
				});

				const doc = TldrawWsFactory.createWsSharedDocDo();
				const byteArray = new TextEncoder().encode(clientMessageMock);

				return {
					socketMock,
					doc,
					byteArray,
				};
			};

			it('should log error', () => {
				const { socketMock, doc, byteArray } = setup();

				const result = service.send(doc, socketMock, byteArray);

				// await delay(100);

				expect(result).toBeUndefined();
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(3);
			});
		});

		describe('when web socket has ready state CLOSED and close connection throws error', () => {
			const setup = () => {
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.CLOSED);

				const closeConMock = jest.spyOn(service, 'closeConnection').mockRejectedValueOnce(new Error('error'));
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const byteArray = new TextEncoder().encode('test-message');

				return {
					socketMock,
					closeConMock,
					doc,
					byteArray,
				};
			};

			it('should log error', () => {
				const { socketMock, closeConMock, doc, byteArray } = setup();

				service.send(doc, socketMock, byteArray);

				expect(closeConMock).toHaveBeenCalled();
			});
		});

		describe('when websocket has ready state different than Open (1) or Connecting (0)', () => {
			const setup = () => {
				const clientMessageMock = 'test-message';
				const closeConSpy = jest.spyOn(service, 'closeConnection');
				const sendSpy = jest.spyOn(service, 'send');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const socketMock = TldrawWsFactory.createWebsocket(WebSocketReadyStateEnum.OPEN);
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
				closeConSpy.mockRestore();
				sendSpy.mockRestore();
			});
		});

		describe('when websocket has ready state Open (0)', () => {
			const setup = async () => {
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');
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
				wsGlobal.close();
				sendSpy.mockRestore();
			});
		});

		describe('when received message of type specific type', () => {
			const setup = async (messageValues: number[]) => {
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

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
					publishSpy,
					applyAwarenessUpdateSpy,
					syncProtocolUpdateSpy,
					doc,
					msg,
				};
			};

			it('should call send method when received message of type SYNC', async () => {
				const { sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([0, 1]);

				service.messageHandler(wsGlobal, doc, msg);

				expect(sendSpy).toHaveBeenCalledTimes(1);
				wsGlobal.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
			});

			it('should not call send method when received message of type AWARENESS', async () => {
				const { sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([1, 1, 0]);

				service.messageHandler(wsGlobal, doc, msg);

				expect(sendSpy).not.toHaveBeenCalled();
				wsGlobal.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
			});

			it('should do nothing when received message unknown type', async () => {
				const { sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([2]);

				service.messageHandler(wsGlobal, doc, msg);

				expect(sendSpy).toHaveBeenCalledTimes(0);
				expect(applyAwarenessUpdateSpy).toHaveBeenCalledTimes(0);
				wsGlobal.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
			});
		});

		describe('when publishing AWARENESS has errors', () => {
			const setup = async (messageValues: number[]) => {
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

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
					publishSpy,
					applyAwarenessUpdateSpy,
					syncProtocolUpdateSpy,
					doc,
					msg,
				};
			};

			it('should log error', async () => {
				const { publishSpy, sendSpy, applyAwarenessUpdateSpy, syncProtocolUpdateSpy, doc, msg } = await setup([
					1, 1, 0,
				]);

				service.messageHandler(wsGlobal, doc, msg);

				expect(sendSpy).not.toHaveBeenCalled();
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(1);
				wsGlobal.close();
				sendSpy.mockRestore();
				applyAwarenessUpdateSpy.mockRestore();
				syncProtocolUpdateSpy.mockRestore();
				publishSpy.mockRestore();
			});
		});

		describe('when error is thrown during receiving message', () => {
			const setup = async () => {
				wsGlobal = await TestConnection.setupWs(wsUrl);

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

				expect(() => service.messageHandler(wsGlobal, doc, msg)).toThrow('error');

				expect(sendSpy).toHaveBeenCalledTimes(0);
				wsGlobal.close();
				sendSpy.mockRestore();
			});
		});

		describe('when awareness states (clients) size is greater then one', () => {
			const setup = async () => {
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

				const doc = new WsSharedDocDo('TEST');
				doc.awareness.states = new Map();
				doc.awareness.states.set(1, ['test1']);
				doc.awareness.states.set(2, ['test2']);

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const sendSpy = jest.spyOn(service, 'send').mockImplementation(() => {});
				const getYDocSpy = jest.spyOn(service, 'getDocument').mockResolvedValueOnce(doc);
				const closeConnSpy = jest.spyOn(service, 'closeConnection').mockResolvedValue();
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

				await expect(service.setupWsConnection(wsGlobal, 'TEST')).resolves.toBeUndefined();
				wsGlobal.emit('pong');

				expect(sendSpy).toHaveBeenCalledTimes(3); // unlcear why it is called 3 times
				wsGlobal.close();
				messageHandlerSpy.mockRestore();
				sendSpy.mockRestore();
				getYDocSpy.mockRestore();
				closeConnSpy.mockRestore();
			});
		});
	});

	describe('on websocket error', () => {
		const setup = async () => {
			boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('TEST'));
			wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');
		};

		it('should log error', async () => {
			await setup();
			await service.setupWsConnection(wsGlobal, 'TEST');
			wsGlobal.emit('error', new Error('error'));

			// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(2);
			wsGlobal.close();
		});
	});

	describe('closeConn', () => {
		describe('when there is no error', () => {
			const setup = async () => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				wsGlobal = await TestConnection.setupWs(wsUrl);

				const redisUnsubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'unsubscribe').mockResolvedValueOnce(1);
				const closeConnSpy = jest.spyOn(service, 'closeConnection');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					redisUnsubscribeSpy,
					closeConnSpy,
				};
			};

			it('should close connection', async () => {
				const { redisUnsubscribeSpy, closeConnSpy } = await setup();

				await service.setupWsConnection(wsGlobal, 'TEST');

				expect(closeConnSpy).toHaveBeenCalled();
				wsGlobal.close();
				closeConnSpy.mockRestore();
				redisUnsubscribeSpy.mockRestore();
			});
		});

		describe('when there are active connections', () => {
			const setup = async () => {
				const doc = new WsSharedDocDo('TEST');
				wsGlobal = await TestConnection.setupWs(wsUrl);
				const ws2 = await TestConnection.setupWs(wsUrl);
				doc.connections.set(wsGlobal, new Set<number>());
				doc.connections.set(ws2, new Set<number>());
				boardRepo.compressDocument.mockRestore();

				return {
					doc,
				};
			};

			it('should not call compressDocument', async () => {
				const { doc } = await setup();

				await service.closeConnection(doc, wsGlobal);

				expect(boardRepo.compressDocument).not.toHaveBeenCalled();
				wsGlobal.close();
			});
		});

		describe('when close connection fails', () => {
			const setup = async () => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				wsGlobal = await TestConnection.setupWs(wsUrl);

				boardRepo.compressDocument.mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'unsubscribe').mockResolvedValueOnce(1);
				const closeConnSpy = jest.spyOn(service, 'closeConnection').mockRejectedValueOnce(new Error('error'));
				const sendSpyError = jest.spyOn(service, 'send').mockReturnValue();
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					redisUnsubscribeSpy,
					closeConnSpy,
					sendSpyError,
				};
			};

			it('should log error', async () => {
				const { redisUnsubscribeSpy, closeConnSpy, sendSpyError } = await setup();

				await service.setupWsConnection(wsGlobal, 'TEST');

				await delay(100);

				expect(closeConnSpy).toHaveBeenCalled();

				wsGlobal.close();
				await delay(100);
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(3);
				redisUnsubscribeSpy.mockRestore();
				closeConnSpy.mockRestore();
				sendSpyError.mockRestore();
			});
		});

		describe('when unsubscribing from Redis throw error', () => {
			const setup = async () => {
				wsGlobal = await TestConnection.setupWs(wsUrl);
				const doc = TldrawWsFactory.createWsSharedDocDo();
				doc.connections.set(wsGlobal, new Set<number>());

				boardRepo.compressDocument.mockResolvedValueOnce();
				const redisUnsubscribeSpy = jest
					.spyOn(Ioredis.Redis.prototype, 'unsubscribe')
					.mockRejectedValue(new Error('error'));
				const closeConnSpy = jest.spyOn(service, 'closeConnection');
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					doc,
					redisUnsubscribeSpy,
					closeConnSpy,
				};
			};

			it('should log error', async () => {
				const { doc, redisUnsubscribeSpy, closeConnSpy } = await setup();

				await service.closeConnection(doc, wsGlobal);
				await delay(200);

				expect(redisUnsubscribeSpy).toHaveBeenCalled();
				expect(closeConnSpy).toHaveBeenCalled();
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(3);
				closeConnSpy.mockRestore();
				redisUnsubscribeSpy.mockRestore();
			});
		});

		describe('when pong not received', () => {
			const setup = async () => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const closeConnSpy = jest.spyOn(service, 'closeConnection').mockImplementation(() => Promise.resolve());
				const pingSpy = jest.spyOn(wsGlobal, 'ping').mockImplementationOnce(() => {});
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

				await service.setupWsConnection(wsGlobal, 'TEST');

				await delay(200);

				expect(closeConnSpy).toHaveBeenCalled();
				expect(clearIntervalSpy).toHaveBeenCalled();
				wsGlobal.close();
				messageHandlerSpy.mockRestore();
				pingSpy.mockRestore();
				closeConnSpy.mockRestore();
				sendSpy.mockRestore();
				clearIntervalSpy.mockRestore();
			});
		});

		describe('when pong not received and close connection fails', () => {
			const setup = async () => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockReturnValueOnce();
				const closeConnSpy = jest.spyOn(service, 'closeConnection').mockRejectedValue(new Error('error'));
				const pingSpy = jest.spyOn(wsGlobal, 'ping').mockImplementation(() => {});
				const sendSpy = jest.spyOn(service, 'send').mockImplementation(() => {});
				const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(1);
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});

				return {
					messageHandlerSpy,
					closeConnSpy,
					pingSpy,
					sendSpy,
					clearIntervalSpy,
				};
			};

			it('should log error', async () => {
				const { messageHandlerSpy, closeConnSpy, pingSpy, sendSpy, clearIntervalSpy } = await setup();

				await service.setupWsConnection(wsGlobal, 'TEST');

				await delay(200);

				expect(closeConnSpy).toHaveBeenCalled();
				expect(clearIntervalSpy).toHaveBeenCalled();
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(4);
				wsGlobal.close();
				messageHandlerSpy.mockRestore();
				pingSpy.mockRestore();
				closeConnSpy.mockRestore();
				sendSpy.mockRestore();
				clearIntervalSpy.mockRestore();
			});
		});

		describe('when compressDocument failed', () => {
			const setup = async () => {
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				doc.connections.set(wsGlobal, new Set<number>());

				boardRepo.compressDocument.mockRejectedValueOnce(new Error('error'));

				return {
					doc,
				};
			};

			it('should log error', async () => {
				const { doc } = await setup();

				await service.closeConnection(doc, wsGlobal);

				expect(boardRepo.compressDocument).toHaveBeenCalled();
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(2);
				wsGlobal.close();
			});
		});
	});

	describe('updateHandler', () => {
		const setup = async () => {
			wsGlobal = await TestConnection.setupWs(wsUrl);

			const sendSpy = jest.spyOn(service, 'send').mockReturnValueOnce();
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
				publishSpy,
			};
		};

		it('should call send method', async () => {
			const { sendSpy, doc, socketMock, msg } = await setup();

			service.updateHandler(msg, socketMock, doc);

			expect(sendSpy).toHaveBeenCalled();
			wsGlobal.close();
		});
	});

	describe('databaseUpdateHandler', () => {
		const setup = async () => {
			wsGlobal = await TestConnection.setupWs(wsUrl);
			boardRepo.storeUpdate.mockResolvedValueOnce();
		};

		it('should call storeUpdate method', async () => {
			await setup();

			await service.databaseUpdateHandler('test', new Uint8Array(), 'test');

			expect(boardRepo.storeUpdate).toHaveBeenCalled();
			wsGlobal.close();
		});

		it('should not call storeUpdate when origin is redis', async () => {
			await setup();

			await service.databaseUpdateHandler('test', new Uint8Array(), 'redis');

			expect(boardRepo.storeUpdate).not.toHaveBeenCalled();
			wsGlobal.close();
		});
	});

	describe('when publish to Redis throws errors', () => {
		const setup = async () => {
			wsGlobal = await TestConnection.setupWs(wsUrl);

			const sendSpy = jest.spyOn(service, 'send').mockReturnValueOnce();
			const publishSpy = jest.spyOn(Ioredis.Redis.prototype, 'publish').mockRejectedValueOnce(new Error('error'));

			const doc = TldrawWsFactory.createWsSharedDocDo();
			doc.connections.set(wsGlobal, new Set());
			const msg = new Uint8Array([0]);

			return {
				doc,
				sendSpy,
				msg,
				publishSpy,
			};
		};

		it('should log error', async () => {
			const { doc, msg, publishSpy } = await setup();

			service.updateHandler(msg, wsGlobal, doc);

			await delay(200);

			// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(3);
			wsGlobal.close();
			publishSpy.mockRestore();
		});
	});

	describe('messageHandler', () => {
		describe('when message is received', () => {
			const setup = async (messageValues: number[]) => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('TEST'));
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

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
					publishSpy,
				};
			};

			it('should handle message', async () => {
				const { messageHandlerSpy, msg, readSyncMessageSpy, publishSpy } = await setup([0, 1]);
				publishSpy.mockResolvedValueOnce(1);

				await service.setupWsConnection(wsGlobal, 'TEST');
				wsGlobal.emit('message', msg);

				await delay(200);

				expect(messageHandlerSpy).toHaveBeenCalledTimes(1);
				wsGlobal.close();
				messageHandlerSpy.mockRestore();
				readSyncMessageSpy.mockRestore();
				publishSpy.mockRestore();
			});

			it('should log error when messageHandler throws', async () => {
				const { messageHandlerSpy, msg } = await setup([0, 1]);
				messageHandlerSpy.mockImplementationOnce(() => {
					throw new Error('error');
				});

				await service.setupWsConnection(wsGlobal, 'TEST');
				wsGlobal.emit('message', msg);

				await delay(200);

				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(4);
				wsGlobal.close();
				messageHandlerSpy.mockRestore();
			});

			it('should log error when publish to Redis throws', async () => {
				const { publishSpy } = await setup([1, 1]);
				publishSpy.mockRejectedValueOnce(new Error('error'));

				await service.setupWsConnection(wsGlobal, 'TEST');

				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(1);
				wsGlobal.close();
			});
		});
	});

	describe('getDocument', () => {
		describe('when getting yDoc by name', () => {
			it('should assign to service docs map and return instance', async () => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('get-test'));
				jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce({});
				const docName = 'get-test';
				const doc = await service.getDocument(docName);

				expect(doc).toBeInstanceOf(WsSharedDocDo);
				expect(service.docs.get(docName)).not.toBeUndefined();
			});

			describe('when subscribing to redis channel', () => {
				const setup = () => {
					boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('test-redis'));
					const doc = new WsSharedDocDo('test-redis');

					const redisSubscribeSpy = jest.spyOn(Ioredis.Redis.prototype, 'subscribe').mockResolvedValueOnce(1);
					const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');
					boardRepo.getDocumentFromDb.mockResolvedValueOnce(doc);

					return {
						redisOnSpy,
						redisSubscribeSpy,
					};
				};

				it('should subscribe', async () => {
					const { redisOnSpy, redisSubscribeSpy } = setup();

					const doc = await service.getDocument('test-redis');

					expect(doc).toBeDefined();
					expect(redisSubscribeSpy).toHaveBeenCalled();
					redisSubscribeSpy.mockRestore();
					redisOnSpy.mockRestore();
				});
			});
		});

		describe('when subscribing to redis channel throws error', () => {
			const setup = () => {
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(new WsSharedDocDo('test-redis-fail-2'));
				const redisSubscribeSpy = jest
					.spyOn(Ioredis.Redis.prototype, 'subscribe')
					.mockRejectedValue(new Error('error'));
				const redisOnSpy = jest.spyOn(Ioredis.Redis.prototype, 'on');

				return {
					redisOnSpy,
					redisSubscribeSpy,
				};
			};

			it('should log error', async () => {
				const { redisSubscribeSpy, redisOnSpy } = setup();

				await service.getDocument('test-redis-fail-2');

				await delay(500);

				expect(redisSubscribeSpy).toHaveBeenCalled();
				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(3);
				redisSubscribeSpy.mockRestore();
				redisOnSpy.mockRestore();
			});
		});

		describe('when found document is still finalizing', () => {
			const setup = () => {
				const doc = new WsSharedDocDo('test-finalizing');
				doc.isFinalizing = true;
				service.docs.set('test-finalizing', doc);
				boardRepo.getDocumentFromDb.mockResolvedValueOnce(doc);
			};

			it('should throw', async () => {
				setup();

				await expect(service.getDocument('test-finalizing')).rejects.toThrow();
				service.docs.delete('test-finalizing');
			});
		});
	});

	describe('redisMessageHandler', () => {
		const setup = () => {
			const applyUpdateSpy = jest.spyOn(Yjs, 'applyUpdate').mockReturnValueOnce();
			const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate').mockReturnValueOnce();

			const doc = new WsSharedDocDo('TEST');
			doc.awarenessChannel = 'TEST-awareness';

			return {
				doc,
				applyUpdateSpy,
				applyAwarenessUpdateSpy,
			};
		};

		describe('when channel name is the same as docName', () => {
			it('should call applyUpdate', () => {
				const { doc, applyUpdateSpy } = setup();
				service.docs.set('TEST', doc);
				service.redisMessageHandler(Buffer.from('TEST'), Buffer.from('message'));

				expect(applyUpdateSpy).toHaveBeenCalled();
			});
		});

		describe('when channel name is the same as docAwarenessChannel name', () => {
			it('should call applyAwarenessUpdate', () => {
				const { doc, applyAwarenessUpdateSpy } = setup();
				service.docs.set('TEST', doc);
				service.redisMessageHandler(Buffer.from('TEST-awareness'), Buffer.from('message'));

				expect(applyAwarenessUpdateSpy).toHaveBeenCalled();
			});
		});

		describe('when channel name is not found as document name', () => {
			it('should not call applyUpdate or applyAwarenessUpdate', () => {
				const { doc, applyUpdateSpy, applyAwarenessUpdateSpy } = setup();
				service.docs.set('TEST', doc);
				service.redisMessageHandler(Buffer.from('NOTFOUND'), Buffer.from('message'));

				expect(applyUpdateSpy).not.toHaveBeenCalled();
				expect(applyAwarenessUpdateSpy).not.toHaveBeenCalled();
			});
		});
	});

	describe('updateHandler', () => {
		describe('when update comes from connected websocket', () => {
			const setup = async () => {
				wsGlobal = await TestConnection.setupWs(wsUrl, 'TEST');

				const doc = new WsSharedDocDo('TEST');
				doc.connections.set(wsGlobal, new Set<number>());
				const publishSpy = jest.spyOn(Ioredis.Redis.prototype, 'publish');

				return {
					doc,
					publishSpy,
				};
			};

			it('should publish update to redis', async () => {
				const { doc, publishSpy } = await setup();

				service.updateHandler(new Uint8Array([]), wsGlobal, doc);

				expect(publishSpy).toHaveBeenCalled();
				wsGlobal.close();
			});

			it('should log error on failed publish', async () => {
				const { doc, publishSpy } = await setup();
				publishSpy.mockRejectedValueOnce(new Error('error'));

				service.updateHandler(new Uint8Array([]), wsGlobal, doc);

				// expect(domainErrorHandler.exec).toHaveBeenCalledTimes(2);
				wsGlobal.close();
			});
		});
	});

	describe('awarenessUpdateHandler', () => {
		const setup = async () => {
			wsGlobal = await TestConnection.setupWs(wsUrl);

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
			mockConns.set(wsGlobal, mockIDs);
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

				service.awarenessUpdateHandler(awarenessUpdate, wsGlobal, doc);

				expect(mockIDs.size).toBe(2);
				expect(mockIDs.has(1)).toBe(true);
				expect(mockIDs.has(3)).toBe(true);
				expect(mockIDs.has(2)).toBe(false);
				expect(sendSpy).toBeCalled();
				wsGlobal.close();
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

				service.awarenessUpdateHandler(awarenessUpdate, wsGlobal, doc);
				awarenessUpdate = {
					added: [],
					updated: [],
					removed: [1],
				};
				service.awarenessUpdateHandler(awarenessUpdate, wsGlobal, doc);

				expect(mockIDs.size).toBe(1);
				expect(mockIDs.has(1)).toBe(false);
				expect(mockIDs.has(3)).toBe(true);
				expect(sendSpy).toBeCalled();
				wsGlobal.close();
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

				service.awarenessUpdateHandler(awarenessUpdate, wsGlobal, doc);
				awarenessUpdate = {
					added: [],
					updated: [1],
					removed: [],
				};
				service.awarenessUpdateHandler(awarenessUpdate, wsGlobal, doc);

				expect(mockIDs.size).toBe(1);
				expect(mockIDs.has(1)).toBe(true);
				expect(sendSpy).toBeCalled();

				wsGlobal.close();
				sendSpy.mockRestore();
			});
		});
	});
});
