import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import WebSocket from 'ws';
import { TextEncoder } from 'util';
import { INestApplication } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import * as Utils from '../../utils/utils';
import { TldrawGateway } from '../tldraw.gateway';

const message =
	'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0Y' +
	'S0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN' +
	'0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

describe('WebSocketGateway (WsAdapter)', () => {
	let ws: WebSocket;
	let app: INestApplication;
	let gateway: TldrawGateway;
	// let utilsSpy;

	async function createNestApp(docName: string): Promise<void> {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawGateway],
		}).compile();
		const testingApp = testingModule.createNestApplication();
		testingApp.useWebSocketAdapter(new WsAdapter(testingApp));

		gateway = testingModule.get<TldrawGateway>(TldrawGateway);
		app = testingApp;

		await app.listen(3335);
		ws = new WebSocket(`ws://localhost:3346/${docName}`);
	}

	async function closeConnections(): Promise<void> {
		ws.close();
		await app.close();
	}

	it(`should refuse connection if there is no docName`, async () => {
		await createNestApp('');
		const utilsSpy = jest.spyOn(Utils, 'messageHandler').mockReturnValue();
		jest.mock('../../utils/utils');
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');

		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const byteArray = new TextEncoder().encode(message);
		const { buffer } = byteArray;

		ws.send(buffer);

		expect(gateway.server).toBeDefined();
		expect(handleConnectionSpy).toHaveBeenCalled();
		expect(handleConnectionSpy).toHaveBeenCalledTimes(1);
		expect(utilsSpy).not.toHaveBeenCalled();

		await closeConnections();
	});

	it(`should handle connection and data transfer`, async () => {
		await createNestApp('TEST1');
		const messageHandlerSpy = jest.spyOn(gateway, 'handleConnection');

		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const byteArray = new TextEncoder().encode(message);
		const { buffer } = byteArray;

		ws.send(buffer);

		expect(messageHandlerSpy).toHaveBeenCalled();
		expect(messageHandlerSpy).toHaveBeenCalledTimes(1);

		await closeConnections();
	});

	it(`should handle 2 connections at same doc and data transfer`, async () => {
		await createNestApp('TEST2');
		const ws2 = new WebSocket(`ws://localhost:3346/TEST2`);
		const utilsSpy = jest.spyOn(Utils, 'setupWSConnection').mockReturnValue();
		jest.mock('../../utils/utils');
		const messageHandlerSpy = jest.spyOn(gateway, 'handleConnection');

		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		await new Promise((resolve) => {
			ws2.on('open', resolve);
		});
		const byteArray = new TextEncoder().encode(message);
		const { buffer } = byteArray;

		ws.send(buffer);
		// ws2.send(buffer);

		expect(utilsSpy).toHaveBeenCalled();
		expect(messageHandlerSpy).toHaveBeenCalled();
		expect(messageHandlerSpy).toHaveBeenCalledTimes(2);
		ws2.close();
		await closeConnections();
	});
});
