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

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	beforeAll(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawGateway],
		}).compile();
		const testingApp = testingModule.createNestApplication();
		testingApp.useWebSocketAdapter(new WsAdapter(testingApp));

		gateway = testingModule.get<TldrawGateway>(TldrawGateway);
		app = testingApp;
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it(`should refuse connection if there is no docName`, async () => {
		ws = new WebSocket(`ws://localhost:3346/`);
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
		handleConnectionSpy.mockReset();
		utilsSpy.mockReset();
		await delay(20);
		ws.close();
	});

	it(`should handle connection and data transfer`, async () => {
		ws = new WebSocket(`ws://localhost:3346/TEST1`);
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');

		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const byteArray = new TextEncoder().encode(message);
		const { buffer } = byteArray;

		ws.send(buffer);

		expect(handleConnectionSpy).toHaveBeenCalled();
		expect(handleConnectionSpy).toHaveBeenCalledTimes(1);

		handleConnectionSpy.mockReset();
		await delay(20);
		ws.close();
	});

	it(`should handle 2 connections at same doc and data transfer`, async () => {
		ws = new WebSocket(`ws://localhost:3346/TEST2`);
		const ws2 = new WebSocket(`ws://localhost:3346/TEST2`);
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');

		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		await new Promise((resolve) => {
			ws2.on('open', resolve);
		});
		const byteArray = new TextEncoder().encode(message);
		const { buffer } = byteArray;

		ws.send(buffer);
		ws2.send(buffer);

		expect(handleConnectionSpy).toHaveBeenCalled();
		expect(handleConnectionSpy).toHaveBeenCalledTimes(2);
		await delay(20);
		ws2.close();
		ws.close();
	});

	it(`check if client will receive message`, async () => {
		ws = new WebSocket(`ws://localhost:3346/TEST3`);
		jest.mock('../../utils/utils');

		const byteArray = new TextEncoder().encode(message);
		const { buffer } = byteArray;

		ws.on('open', () => {
			ws.send(buffer, () => {});
		});
		gateway.server.on('connection', (client) => {
			client.on('message', (payload) => {
				expect(payload).toBeInstanceOf(Buffer);
			});
		});

		await delay(20);
		ws.close();
	});
});
