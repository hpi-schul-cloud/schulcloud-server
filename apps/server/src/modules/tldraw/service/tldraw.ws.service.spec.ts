import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import { WsSharedDocDo } from '@src/modules/tldraw/types';
import { TextEncoder } from 'util';
import * as SyncProtocols from 'y-protocols/sync';
import * as AwarenessProtocol from 'y-protocols/awareness';
import { encoding } from 'lib0';
import { TldrawBoardRepo } from '@src/modules/tldraw/repo';
import { TldrawWs } from '@src/modules/tldraw/controller';
import { TldrawWsService } from '.';
import { TestHelper } from '../helper/test-helper';

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

	const gatewayPort = 3346;
	const wsUrl = TestHelper.getWsUrl(gatewayPort);
	const testMessage =
		'AZQBAaCbuLANBIsBeyJpZCI6ImU1YTYwZGVjLTJkMzktNDAxZS0xMDVhLWIwMmM0N2JkYjFhMiIsInRkVXNlciI6eyJp' +
		'ZCI6ImU1YTYwZGVjLTJkMzktNDAxZS0xMDVhLWIwMmM0N2JkYjFhMiIsImNvbG9yIjoiI0JENTRDNiIsInBvaW50Ijpb' +
		'ODY4LDc2OV0sInNlbGVjdGVkSWRzIjpbXSwiYWN0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	jest.useFakeTimers();

	beforeAll(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawWs, TldrawBoardRepo, TldrawWsService],
		}).compile();

		service = testingModule.get<TldrawWsService>(TldrawWsService);
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

	it('should service properties be defined', () => {
		expect(service).toBeDefined();
		expect(service.pingTimeout).toBeDefined();
		expect(service.persistence).toBeDefined();
	});

	describe('when client is not connected to WS', () => {
		const setup = async () => {
			ws = await TestHelper.setupWs(wsUrl);

			const closeConSpy = jest.spyOn(service, 'closeConn').mockImplementationOnce(() => {});
			const sendSpy = jest.spyOn(service, 'send');
			const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
			const byteArray = new TextEncoder().encode(testMessage);

			return {
				closeConSpy,
				sendSpy,
				doc,
				byteArray,
			};
		};

		it('should throw error for send message', async () => {
			const { closeConSpy, sendSpy, doc, byteArray } = await setup();

			service.send(doc as WsSharedDocDo, ws, byteArray);

			expect(sendSpy).toThrow();
			expect(sendSpy).toHaveBeenCalledWith(doc, ws, byteArray);
			expect(closeConSpy).toHaveBeenCalled();

			ws.close();
			sendSpy.mockRestore();
		});
	});

	describe('when websocket has ready state different than 0 or 1', () => {
		const setup = () => {
			const closeConSpy = jest.spyOn(service, 'closeConn');
			const sendSpy = jest.spyOn(service, 'send');
			const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
			const socketMock = { readyState: 3, close: () => {} };
			const byteArray = new TextEncoder().encode(testMessage);

			return {
				closeConSpy,
				sendSpy,
				doc,
				socketMock,
				byteArray,
			};
		};

		it('should close connection if websocket has ready state different than 0 or 1', () => {
			const { closeConSpy, sendSpy, doc, socketMock, byteArray } = setup();

			service.send(doc as WsSharedDocDo, socketMock as WebSocket, byteArray);

			expect(sendSpy).toHaveBeenCalledWith(doc, socketMock, byteArray);
			expect(sendSpy).toHaveBeenCalledTimes(1);
			expect(closeConSpy).toHaveBeenCalled();

			closeConSpy.mockRestore();
			sendSpy.mockRestore();
		});
	});

	describe('when websocket has ready state 0', () => {
		const setup = async () => {
			ws = await TestHelper.setupWs(wsUrl);

			const sendSpy = jest.spyOn(service, 'send');
			const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
			const socketMock = { readyState: 0, close: () => {} };
			doc.conns.set(socketMock as WebSocket, new Set());
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, 2);
			const updateByteArray = new TextEncoder().encode(testMessage);
			encoding.writeVarUint8Array(encoder, updateByteArray);
			const msg = encoding.toUint8Array(encoder);
			return {
				sendSpy,
				doc,
				msg,
			};
		};

		it('should call send in updateHandler', async () => {
			const { sendSpy, doc, msg } = await setup();

			service.updateHandler(msg, {}, doc as WsSharedDocDo);

			expect(sendSpy).toHaveBeenCalled();

			ws.close();
			sendSpy.mockRestore();
		});
	});

	describe('when received message of specific type', () => {
		const setup = async (messageValues: number[]) => {
			ws = await TestHelper.setupWs(wsUrl, 'TEST');

			const sendSpy = jest.spyOn(service, 'send');
			const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate');
			const syncProtocolUpdateSpy = jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementationOnce((dec, enc) => {
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

	describe('when message is sent', () => {
		const setup = async (messageValues: number[]) => {
			ws = await TestHelper.setupWs(wsUrl, 'TEST');

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

	describe('when error is thrown', () => {
		const setup = async () => {
			ws = await TestHelper.setupWs(wsUrl);

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

	describe('when trying to close already closed connection', () => {
		const setup = async () => {
			ws = await TestHelper.setupWs(wsUrl);

			jest.spyOn(ws, 'close').mockImplementationOnce(() => {
				throw new Error('some error');
			});
		};

		it('should throw error when trying to close already closed connection', async () => {
			await setup();
			try {
				const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
				service.closeConn(doc as WsSharedDocDo, ws);
			} catch (err) {
				expect(err).toBeDefined();
			}

			ws.close();
		});
	});

	describe('when ping failed', () => {
		const setup = async () => {
			ws = await TestHelper.setupWs(wsUrl, 'TEST');

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

			await delay(200);

			expect(closeConnSpy).toHaveBeenCalled();

			ws.close();
			messageHandlerSpy.mockRestore();
			closeConnSpy.mockRestore();
		});
	});

	describe('when awareness states size greater then one', () => {
		const setup = async () => {
			ws = await TestHelper.setupWs(wsUrl, 'TEST');

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

		it('should send if awareness states size greater then one', async () => {
			const { messageHandlerSpy, sendSpy, getYDocSpy } = await setup();

			service.setupWSConnection(ws);

			await delay(200);

			expect(sendSpy).toHaveBeenCalledTimes(2);

			ws.close();
			messageHandlerSpy.mockRestore();
			sendSpy.mockRestore();
			getYDocSpy.mockRestore();
		});
	});
});
