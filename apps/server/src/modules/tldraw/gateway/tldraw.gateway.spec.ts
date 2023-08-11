import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import * as Utils from '@src/modules/tldraw/utils/utils';
import { WSSharedDoc } from '@src/modules/tldraw/utils/utils';
import { TextEncoder } from 'util';
import * as SyncProtocols from 'y-protocols/sync';
import { Awareness } from 'y-protocols/awareness';
import { encoding } from 'lib0';
import { TldrawGateway } from '.';

describe('TldrawGateway', () => {
	let app: INestApplication;
	let gateway: TldrawGateway;
	let ws: WebSocket;

	const gatewayPort = 3346;
	const wsUrl = `ws://localhost:${gatewayPort}`;
	const testMessage =
		'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0Y' +
		'S0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN' +
		'0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

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
	});

	afterEach(async () => {
		await app.close();
	});

	it('should gateway properties be defined', async () => {
		await app.init();

		expect(gateway).toBeDefined();
		expect(gateway.configService).toBeDefined();
		expect(gateway.server).toBeDefined();
		expect(gateway.connectionString).toBeDefined();
		expect(gateway.afterInit).toBeDefined();
		expect(gateway.handleConnection).toBeDefined();
	});

	it('should throw error for send message -> close connection (due to not connected client socket to WS) ', async () => {
		await app.init();

		ws = new WebSocket(wsUrl);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const closeConSpy = jest.spyOn(Utils, 'closeConn').mockImplementationOnce(() => {});
		const sendSpy = jest.spyOn(Utils, 'send');
		const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
		const byteArray = new TextEncoder().encode(testMessage);
		Utils.send(doc as WSSharedDoc, ws, byteArray);

		expect(sendSpy).toThrow();
		expect(sendSpy).toHaveBeenCalledWith(doc, ws, byteArray);
		expect(closeConSpy).toHaveBeenCalled();

		ws.close();
		sendSpy.mockReset();
	});

	it('should close connection if websocket has ready state different than 0 or 1', async () => {
		await app.init();

		ws = new WebSocket(wsUrl);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const closeConSpy = jest.spyOn(Utils, 'closeConn');
		const sendSpy = jest.spyOn(Utils, 'send');
		const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
		const socketMock = { readyState: 3, close: () => {} };
		const byteArray = new TextEncoder().encode(testMessage);

		Utils.send(doc as WSSharedDoc, socketMock as WebSocket, byteArray);

		expect(sendSpy).toHaveBeenCalledWith(doc, socketMock, byteArray);
		expect(sendSpy).toHaveBeenCalledTimes(1);
		expect(closeConSpy).toHaveBeenCalled();

		ws.close();
		closeConSpy.mockReset();
		sendSpy.mockReset();
	});

	it('update handler check if send was called', async () => {
		await app.init();

		ws = new WebSocket(wsUrl);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const sendSpy = jest.spyOn(Utils, 'send');
		const doc: { conns: Map<WebSocket, Set<number>> } = { conns: new Map() };
		const socketMock = { readyState: 0, close: () => {} };
		doc.conns.set(socketMock as WebSocket, new Set());
		const byteArray = new TextEncoder().encode(testMessage);
		Utils.updateHandler(byteArray, {}, doc as WSSharedDoc);

		expect(sendSpy).toHaveBeenCalled();

		ws.close();
		sendSpy.mockReset();
	});

	it('awareness change handler testing', async () => {
		await app.init();

		ws = new WebSocket(wsUrl);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		class MockAwareness {
			on = jest.fn();
		}
		const doc = new WSSharedDoc('TEST');
		doc.awareness = new MockAwareness() as unknown as Awareness;
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

		doc.awarenessChangeHandler(awarenessUpdate, ws);

		expect(mockIDs.size).toBe(2);
		expect(mockIDs.has(1)).toBe(true);
		expect(mockIDs.has(3)).toBe(true);
		expect(mockIDs.has(2)).toBe(false);
		expect(sendSpy).toBeCalled();

		ws.close();
		sendSpy.mockReset();
	});

	it('should not call send method when received empty message', async () => {
		await app.init();

		ws = new WebSocket(wsUrl);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		jest.spyOn(SyncProtocols, 'readSyncMessage').mockReturnValue(0);
		const sendSpy = jest.spyOn(Utils, 'send');
		const doc = new WSSharedDoc('TEST');
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, 0);
		encoding.writeVarUint(encoder, 1);
		const newMessageByteArray = encoding.toUint8Array(encoder);
		Utils.messageHandler(ws, doc, newMessageByteArray);

		expect(sendSpy).toHaveBeenCalledTimes(0);

		ws.close();
		sendSpy.mockReset();
	});
});
