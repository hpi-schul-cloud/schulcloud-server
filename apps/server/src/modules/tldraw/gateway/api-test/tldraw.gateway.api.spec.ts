import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import WebSocket from 'ws';
import { TextEncoder } from 'util';
import { INestApplication } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import * as process from 'process';
import * as Utils from '../../utils/utils';
import { TldrawGateway } from '../tldraw.gateway';

describe('WebSocketGateway (WsAdapter)', () => {
	let app: INestApplication;
	let gateway: TldrawGateway;
	let ws: WebSocket;

	const gatewayPort = 3346;
	const wsUrl = `ws://localhost:${gatewayPort}`;
	const testMessage =
		'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0Y' +
		'S0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN' +
		'0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	jest.setTimeout(7000);

	beforeAll(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawGateway],
		}).compile();
		gateway = testingModule.get<TldrawGateway>(TldrawGateway);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval'] });
	});

	it(`should handle connection and data transfer`, async () => {
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
		const reduceMock = jest.spyOn(Uint8Array.prototype, 'reduce').mockReturnValue(1);

		ws = new WebSocket(`${wsUrl}/TEST1`);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		await new Promise((resolve) => {
			process.nextTick(resolve);
		});

		const byteArray = new TextEncoder().encode(testMessage);
		const { buffer } = byteArray;
		ws.send(buffer, () => {});

		expect(handleConnectionSpy).toHaveBeenCalled();
		expect(handleConnectionSpy).toHaveBeenCalledTimes(1);

		await delay(2000);
		ws.close();
		handleConnectionSpy.mockReset();
		reduceMock.mockReset();
	});

	it(`should refuse connection if there is no docName`, async () => {
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
		const utilsSpy = jest.spyOn(Utils, 'messageHandler').mockReturnValue();

		ws = new WebSocket(wsUrl);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const byteArray = new TextEncoder().encode(testMessage);
		const { buffer } = byteArray;
		ws.send(buffer);

		expect(gateway.server).toBeDefined();
		expect(handleConnectionSpy).toHaveBeenCalled();
		expect(handleConnectionSpy).toHaveBeenCalledTimes(1);
		expect(utilsSpy).not.toHaveBeenCalled();

		await delay(200);
		ws.close();
		handleConnectionSpy.mockReset();
		utilsSpy.mockReset();
	});

	it(`should handle 2 connections at same doc and data transfer`, async () => {
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');

		ws = new WebSocket(`${wsUrl}/TEST2`);
		const ws2 = new WebSocket(`${wsUrl}/TEST2`);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});
		await new Promise((resolve) => {
			ws2.on('open', resolve);
		});

		const byteArray = new TextEncoder().encode(testMessage);
		const { buffer } = byteArray;
		ws.send(buffer);
		ws2.send(buffer);

		expect(handleConnectionSpy).toHaveBeenCalled();
		expect(handleConnectionSpy).toHaveBeenCalledTimes(2);

		await delay(200);
		ws.close();
		ws2.close();
		handleConnectionSpy.mockReset();
	});

	it(`check if client will receive message`, async () => {
		const messageHandlerSpy = jest.spyOn(Utils, 'messageHandler');
		ws = new WebSocket(`${wsUrl}/TEST3`);
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		const byteArray = new TextEncoder().encode(testMessage);
		const { buffer } = byteArray;
		ws.send(buffer, () => {});

		gateway.server.on('connection', (client) => {
			client.on('message', (payload) => {
				expect(payload).toBeInstanceOf(Buffer);
			});
		});

		await delay(200);
		expect(messageHandlerSpy).toHaveBeenCalledTimes(1);
		ws.close();
		messageHandlerSpy.mockReset();
	});
});
