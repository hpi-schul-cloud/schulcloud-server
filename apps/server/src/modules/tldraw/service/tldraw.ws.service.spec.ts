import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { TextEncoder } from 'util';
import * as SyncProtocols from 'y-protocols/sync';
import * as AwarenessProtocol from 'y-protocols/awareness';
import { encoding } from 'lib0';
import { TldrawWsFactory } from '@shared/testing/factory/tldraw.ws.factory';
import { LegacyLogger } from '@src/core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { TldrawWs } from '../controller';
import { config } from '../config';
import { TldrawDrawing } from '../entities';
import { TldrawBoardRepo, TldrawRepo, YMongodb } from '../repo';
import { TestConnection } from '../testing/test-connection';
import { WsSharedDocDo } from '../domain';
import { TldrawWsService } from '.';

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
	let logger: DeepMocked<LegacyLogger>;

	const gatewayPort = 3346;
	const wsUrl = TestConnection.getWsUrl(gatewayPort);

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	jest.useFakeTimers();

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({ entities: [TldrawDrawing] }),
				ConfigModule.forRoot(createConfigModuleOptions(config)),
			],
			providers: [
				TldrawWs,
				TldrawWsService,
				TldrawBoardRepo,
				TldrawRepo,
				YMongodb,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = testingModule.get<TldrawWsService>(TldrawWsService);
		boardRepo = testingModule.get<TldrawBoardRepo>(TldrawBoardRepo);
		logger = testingModule.get(LegacyLogger);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] });
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

	it('should chcek if service properties are set correctly', () => {
		expect(service).toBeDefined();
		expect(service.pingTimeout).toBeDefined();
	});

	describe('send', () => {
		describe('when client is not connected to WS', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);
				const clientMessageMock = 'test-message';

				const closeConSpy = jest.spyOn(service, 'closeConn').mockImplementationOnce(() => {});
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

		describe('when websocket has ready state different than 0 or 1', () => {
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

		describe('when websocket has ready state 0', () => {
			const setup = async () => {
				ws = await TestConnection.setupWs(wsUrl);
				const clientMessageMock = 'test-message';

				const sendSpy = jest.spyOn(service, 'send');
				const doc = TldrawWsFactory.createWsSharedDocDo();
				const socketMock = TldrawWsFactory.createWebsocket(0);
				doc.conns.set(socketMock, new Set());
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
				const doc = new WsSharedDocDo('TEST', service);
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
				const doc = new WsSharedDocDo('TEST', service);
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

				const doc = new WsSharedDocDo('TEST', service);
				doc.awareness.states = new Map();
				doc.awareness.states.set(1, ['test1']);
				doc.awareness.states.set(2, ['test2']);

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockImplementationOnce(() => {});
				const sendSpy = jest.spyOn(service, 'send');
				const getYDocSpy = jest.spyOn(service, 'getYDoc').mockImplementationOnce(() => doc);
				const { msg } = createMessage([0]);
				jest.spyOn(AwarenessProtocol, 'encodeAwarenessUpdate').mockImplementationOnce(() => msg);

				return {
					messageHandlerSpy,
					sendSpy,
					getYDocSpy,
				};
			};

			it('should send to every client', async () => {
				const { messageHandlerSpy, sendSpy, getYDocSpy } = await setup();

				service.setupWSConnection(ws);

				expect(sendSpy).toHaveBeenCalledTimes(2);

				ws.close();
				messageHandlerSpy.mockRestore();
				sendSpy.mockRestore();
				getYDocSpy.mockRestore();
			});
		});
	});

	describe('closeConn', () => {
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

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler').mockImplementationOnce(() => {});
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

				service.setupWSConnection(ws);

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

				const flushDocumentSpy = jest.spyOn(boardRepo, 'flushDocument').mockRejectedValueOnce(() => new Error('error'));
				const errorLogSpy = jest.spyOn(logger, 'error');

				return {
					flushDocumentSpy,
					errorLogSpy,
				};
			};

			it('should log error', async () => {
				const { flushDocumentSpy, errorLogSpy } = await setup();

				service.setupWSConnection(ws);

				await delay(10);

				expect(flushDocumentSpy).toHaveBeenCalled();
				expect(errorLogSpy).toHaveBeenCalled();

				ws.close();
				flushDocumentSpy.mockRestore();
			});
		});
	});

	describe('messageHandler', () => {
		describe('when message is received', () => {
			const setup = async (messageValues: number[]) => {
				ws = await TestConnection.setupWs(wsUrl, 'TEST');

				const messageHandlerSpy = jest.spyOn(service, 'messageHandler');
				const readSyncMessageSpy = jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementationOnce((dec, enc) => {
					enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
					return 1;
				});
				const { msg } = createMessage(messageValues);

				return {
					messageHandlerSpy,
					msg,
					readSyncMessageSpy,
				};
			};

			it('should handle message', async () => {
				const { messageHandlerSpy, msg, readSyncMessageSpy } = await setup([0, 1]);

				service.setupWSConnection(ws);
				ws.emit('message', msg);

				expect(messageHandlerSpy).toHaveBeenCalledTimes(1);

				ws.close();
				messageHandlerSpy.mockRestore();
				readSyncMessageSpy.mockRestore();
			});
		});
	});

	describe('getYDoc', () => {
		describe('when getting yDoc by name', () => {
			it('should assign to service.doc and return instance', () => {
				const docName = 'get-test';
				const doc = service.getYDoc(docName);
				expect(doc).toBeInstanceOf(WsSharedDocDo);
				expect(service.docs.get(docName)).not.toBeUndefined();
			});
		});
	});
});
