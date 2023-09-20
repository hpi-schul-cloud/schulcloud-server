import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { MongodbPersistence } from 'y-mongodb-provider';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import * as Utils from '@src/modules/tldraw/utils/utils';
import {calculateDiff, WSSharedDoc} from '@src/modules/tldraw/utils/utils';
import { TextEncoder } from 'util';
import * as SyncProtocols from 'y-protocols/sync';
import * as AwarenessProtocol from 'y-protocols/awareness';
import { encoding } from 'lib0';
import { TldrawGateway } from '.';

describe('TldrawGateway', () => {
	let app: INestApplication;
	let gateway: TldrawGateway;
	let ws: WebSocket;

	const gatewayPort = 3346;
	const wsUrl = `ws://localhost:${gatewayPort}`;
	const testMessage =
		'AZQBAaCbuLANBIsBeyJpZCI6ImU1YTYwZGVjLTJkMzktNDAxZS0xMDVhLWIwMmM0N2JkYjFhMiIsInRkVXNlciI6eyJp' +
		'ZCI6ImU1YTYwZGVjLTJkMzktNDAxZS0xMDVhLWIwMmM0N2JkYjFhMiIsImNvbG9yIjoiI0JENTRDNiIsInBvaW50Ijpb' +
		'ODY4LDc2OV0sInNlbGVjdGVkSWRzIjpbXSwiYWN0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	jest.useFakeTimers();

	beforeEach(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawGateway],
		}).compile();

		gateway = testingModule.get<TldrawGateway>(TldrawGateway);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] });
	});

	afterEach(async () => {
		await app.close();
	});

	const setupWs = async (docName?: string) => {
		if (docName) {
			ws = new WebSocket(`${wsUrl}/${docName}`);
		} else {
			ws = new WebSocket(`${wsUrl}`);
		}
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});
	};

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

	it('should gateway properties be defined', async () => {
		await app.init();

		expect(gateway).toBeDefined();
		expect(gateway.configService).toBeDefined();
		expect(gateway.server).toBeDefined();
		expect(gateway.afterInit).toBeDefined();
		expect(gateway.handleConnection).toBeDefined();
	});

	describe('when client is not connected to WS', () => {
		const setup = async () => {
			await app.init();
			await setupWs();

			const closeConSpy = jest.spyOn(Utils, 'closeConn').mockImplementationOnce(() => {});
			const sendSpy = jest.spyOn(Utils, 'send');
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

			Utils.send(doc as WSSharedDoc, ws, byteArray);

			expect(sendSpy).toThrow();
			expect(sendSpy).toHaveBeenCalledWith(doc, ws, byteArray);
			expect(closeConSpy).toHaveBeenCalled();

			ws.close();
			sendSpy.mockRestore();
		});
	});

	describe('when websocket has ready state different than 0 or 1', () => {
		const setup = async () => {
			await app.init();

			const closeConSpy = jest.spyOn(Utils, 'closeConn');
			const sendSpy = jest.spyOn(Utils, 'send');
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

		it('should close connection if websocket has ready state different than 0 or 1', async () => {
			const { closeConSpy, sendSpy, doc, socketMock, byteArray } = await setup();

			Utils.send(doc as WSSharedDoc, socketMock as WebSocket, byteArray);

			expect(sendSpy).toHaveBeenCalledWith(doc, socketMock, byteArray);
			expect(sendSpy).toHaveBeenCalledTimes(1);
			expect(closeConSpy).toHaveBeenCalled();

			closeConSpy.mockRestore();
			sendSpy.mockRestore();
		});
	});

	describe('when websocket has ready state 0', () => {
		const setup = async () => {
			await app.init();
			await setupWs();

			const sendSpy = jest.spyOn(Utils, 'send');
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

			Utils.updateHandler(msg, {}, doc as WSSharedDoc);

			expect(sendSpy).toHaveBeenCalled();

			ws.close();
			sendSpy.mockRestore();
		});
	});

	describe('when awareness change was called', () => {
		const setup = async () => {
			await app.init();
			await setupWs();

			class MockAwareness {
				on = jest.fn();
			}
			const doc = new WSSharedDoc('TEST');
			doc.awareness = new MockAwareness() as unknown as AwarenessProtocol.Awareness;
			const mockMeta = new Map<number, { clock: number; lastUpdated: number }>();
			mockMeta.set(1, { clock: 11, lastUpdated: 21 });
			mockMeta.set(2, { clock: 12, lastUpdated: 22 });
			mockMeta.set(3, { clock: 13, lastUpdated: 23 });
			const states = new Map<number, { [x: string]: unknown }>();
			states.set(1, { updating: '21' });
			states.set(2, { updating: '22' });
			states.set(3, { updating: '23' });
			doc.awareness.states = states;
			doc.awareness.meta = mockMeta;

			const sendSpy = jest.spyOn(Utils, 'send').mockReturnValue();

			const mockIDs = new Set<number>();
			const mockConns = new Map<WebSocket, Set<number>>();
			mockConns.set(ws, mockIDs);
			doc.conns = mockConns;

			const awarenessUpdate = {
				added: [1, 3],
				updated: [],
				removed: [2],
			};

			return {
				sendSpy,
				doc,
				mockIDs,
				awarenessUpdate,
			};
		};

		it('should correctly update awwereness', async () => {
			const { sendSpy, doc, mockIDs, awarenessUpdate } = await setup();

			doc.awarenessChangeHandler(awarenessUpdate, ws);

			expect(mockIDs.size).toBe(2);
			expect(mockIDs.has(1)).toBe(true);
			expect(mockIDs.has(3)).toBe(true);
			expect(mockIDs.has(2)).toBe(false);
			expect(sendSpy).toBeCalled();

			ws.close();
			sendSpy.mockRestore();
		});
	});

	describe('when received message of specific type', () => {
		const setup = async (messageValues: number[]) => {
			await app.init();
			await setupWs('TEST');

			const sendSpy = jest.spyOn(Utils, 'send');
			const applyAwarenessUpdateSpy = jest.spyOn(AwarenessProtocol, 'applyAwarenessUpdate');
			jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementation((dec, enc) => {
				enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
				return 1;
			});
			const doc = new WSSharedDoc('TEST');
			const { msg } = createMessage(messageValues);

			return {
				sendSpy,
				applyAwarenessUpdateSpy,
				doc,
				msg,
			};
		};

		it('should call send method when received message of type SYNC', async () => {
			const { sendSpy, doc, msg } = await setup([0, 1]);

			Utils.messageHandler(ws, doc, msg);

			expect(sendSpy).toHaveBeenCalledTimes(1);

			ws.close();
			sendSpy.mockRestore();
		});

		it('should not call send method when received message of type AWARENESS', async () => {
			const { sendSpy, applyAwarenessUpdateSpy, doc, msg } = await setup([1, 1, 0]);
			Utils.messageHandler(ws, doc, msg);

			expect(sendSpy).toHaveBeenCalledTimes(0);
			expect(applyAwarenessUpdateSpy).toHaveBeenCalledTimes(1);

			ws.close();
			sendSpy.mockRestore();
			applyAwarenessUpdateSpy.mockRestore();
		});

		it('should do nothing when received message unknown type', async () => {
			const { sendSpy, applyAwarenessUpdateSpy, doc, msg } = await setup([2]);
			Utils.messageHandler(ws, doc, msg);

			expect(sendSpy).toHaveBeenCalledTimes(0);
			expect(applyAwarenessUpdateSpy).toHaveBeenCalledTimes(0);

			ws.close();
			sendSpy.mockRestore();
			applyAwarenessUpdateSpy.mockRestore();
		});
	});

	describe('when message is sent', () => {
		const setup = async (messageValues: number[]) => {
			await app.init();
			await setupWs('TEST');

			const messageHandlerSpy = jest.spyOn(Utils, 'messageHandler');
			jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementation((dec, enc) => {
				enc.bufs = [new Uint8Array(2), new Uint8Array(2)];
				return 1;
			});
			const { msg } = createMessage(messageValues);

			return {
				messageHandlerSpy,
				msg,
			};
		};

		it('should handle message', async () => {
			const { messageHandlerSpy, msg } = await setup([0, 1]);

			Utils.setupWSConnection(ws);
			ws.emit('message', msg);

			expect(messageHandlerSpy).toHaveBeenCalledTimes(1);

			ws.close();
			messageHandlerSpy.mockRestore();
		});
	});

	describe('when error is thrown', () => {
		const setup = async () => {
			await app.init();
			await setupWs();

			const sendSpy = jest.spyOn(Utils, 'send');
			jest.spyOn(SyncProtocols, 'readSyncMessage').mockImplementation(() => {
				throw new Error('error');
			});
			const doc = new WSSharedDoc('TEST');
			const { msg } = createMessage([0, 1]);

			return {
				sendSpy,
				doc,
				msg,
			};
		};

		it('should not call send method', async () => {
			const { sendSpy, doc, msg } = await setup();

			Utils.messageHandler(ws, doc, msg);

			expect(sendSpy).toHaveBeenCalledTimes(0);

			ws.close();
			sendSpy.mockRestore();
		});
	});

	describe('when trying to close already closed connection', () => {
		const setup = async () => {
			await app.init();
			await setupWs();

			jest.spyOn(ws, 'close').mockImplementationOnce(() => {
				throw new Error('some error');
			});
		};

		it('should throw error when trying to close already closed connection', async () => {
			await setup();
			try {
				const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
				Utils.closeConn(doc as WSSharedDoc, ws);
			} catch (err) {
				expect(err).toBeDefined();
			}

			ws.close();
		});
	});

	describe('when pin failed', () => {
		const setup = async () => {
			await app.init();
			await setupWs('TEST');

			const messageHandlerSpy = jest.spyOn(Utils, 'messageHandler').mockImplementation(() => {});
			const closeConnSpy = jest.spyOn(Utils, 'closeConn');
			jest.spyOn(ws, 'ping').mockImplementation(() => {
				throw new Error('error');
			});

			return {
				messageHandlerSpy,
				closeConnSpy,
			};
		};

		it('should close connection', async () => {
			const { messageHandlerSpy, closeConnSpy } = await setup();

			Utils.setupWSConnection(ws);

			await delay(200);

			expect(closeConnSpy).toHaveBeenCalled();

			ws.close();
			messageHandlerSpy.mockRestore();
			closeConnSpy.mockRestore();
		});
	});

	describe('when awareness states size greater then one', () => {
		const setup = async () => {
			await app.init();
			await setupWs('TEST');

			const doc = new WSSharedDoc('TEST');
			doc.awareness.states = new Map();
			doc.awareness.states.set(1, ['test1']);
			doc.awareness.states.set(2, ['test2']);

			const messageHandlerSpy = jest.spyOn(Utils, 'messageHandler').mockImplementation(() => {});
			const sendSpy = jest.spyOn(Utils, 'send');
			const getYDocSpy = jest.spyOn(Utils, 'getYDoc').mockImplementation(() => doc);
			const { msg } = createMessage([0, 1]);
			jest.spyOn(AwarenessProtocol, 'encodeAwarenessUpdate').mockImplementation(() => msg);

			return {
				messageHandlerSpy,
				sendSpy,
				getYDocSpy,
			};
		};

		it('should send if awareness states size greater then one', async () => {
			const { messageHandlerSpy, sendSpy, getYDocSpy } = await setup();

			Utils.setupWSConnection(ws);

			await delay(200);

			expect(sendSpy).toHaveBeenCalledTimes(2);

			ws.close();
			messageHandlerSpy.mockRestore();
			sendSpy.mockRestore();
			getYDocSpy.mockRestore();
		});
	});

	describe('when document receive update', () => {
		const setup = async () => {
			await app.init();

			const doc = new WSSharedDoc('TEST');
			await setupWs('TEST');
			const wsSet = new Set();
			wsSet.add(ws);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			doc.conns.set(ws, wsSet);
			const mdb = {
				getYDoc: (docName: string) => new WSSharedDoc(docName),
				storeUpdate: () => {},
			};
			const storeUpdateSpy = jest.spyOn(mdb, 'storeUpdate');
			const byteArray = new TextEncoder().encode(testMessage);
			jest.spyOn(Utils, 'calculateDiff').mockImplementation(() => 1);

			return {
				mdb,
				doc,
				byteArray,
				storeUpdateSpy,
			};
		};

		it('should store on db', async () => {
			const { mdb, doc, byteArray, storeUpdateSpy } = await setup();

			await Utils.updateDocument(mdb as MongodbPersistence, 'TEST', doc);
			doc.emit('update', [byteArray, undefined, doc]);
			await delay(200);
			expect(storeUpdateSpy).toHaveBeenCalled();
			storeUpdateSpy.mockRestore();
		});
	});
});
