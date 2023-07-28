import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import * as Utils from '@src/modules/tldraw/utils/utils';
import { Awareness } from 'y-protocols/awareness';
import { WSSharedDoc } from '@src/modules/tldraw/utils/utils';
import { TldrawGateway } from '.';

describe('TldrawGateway', () => {
	let gateway: TldrawGateway;
	let clientSocket: WebSocket;
	let app: INestApplication;
	const gatewayPort = 3346;

	beforeAll(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const module: TestingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawGateway],
		}).compile();
		app = module.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		gateway = module.get<TldrawGateway>(TldrawGateway);
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should gateway properties be defined', () => {
		expect(gateway).toBeDefined();
		expect(gateway.configService).toBeDefined();
		expect(gateway.server).toBeDefined();
		expect(gateway.connectionString).toBeDefined();
		expect(gateway.afterInit).toBeDefined();
		expect(gateway.handleConnection).toBeDefined();
	});

	it('should throw error for not connected WebSocket', () => {
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
		const closeConSpy = jest.spyOn(Utils, 'closeConn').mockReturnValue();
		const sendSpy = jest.spyOn(Utils, 'send');
		const message = 'TEST STRING';
		const request = new Request(new URL(`ws://localhost:${gatewayPort}?roomName=TEST`), {
			body: message,
			method: 'POST',
		});
		clientSocket = new WebSocket(`ws://localhost:${gatewayPort}/TEST`);
		gateway.handleConnection(clientSocket, request);

		expect(handleConnectionSpy).toHaveBeenCalledWith(clientSocket, request);
		expect(sendSpy).toThrow();
		expect(closeConSpy).toHaveBeenCalled();
	});

	it('awareness change handler testing', () => {
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

		// const docAwarenessSpy = jest.spyOn(doc, 'awarenessChangeHandler');
		const sendSpy = jest.spyOn(Utils, 'send').mockReturnValue();

		const mockIDs = new Set<number>();
		const mockConns = new Map<WebSocket, Set<number>>();
		mockConns.set(clientSocket, mockIDs);
		doc.conns = mockConns;

		const awarenessUpdate = {
			added: [1, 3],
			updated: [],
			removed: [2],
		};

		doc.awarenessChangeHandler(awarenessUpdate, clientSocket);

		expect(mockIDs.size).toBe(2);
		expect(mockIDs.has(1)).toBe(true);
		expect(mockIDs.has(3)).toBe(true);
		expect(mockIDs.has(2)).toBe(false);
		expect(sendSpy).toBeCalled();
	});
});
