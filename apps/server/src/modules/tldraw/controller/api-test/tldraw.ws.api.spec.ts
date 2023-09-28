import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import WebSocket from 'ws';
import { TextEncoder } from 'util';
import { INestApplication } from '@nestjs/common';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import { TldrawWs } from '../tldraw.ws';

describe('WebSocketController (WsAdapter)', () => {
	let app: INestApplication;
	let gateway: TldrawWs;
	let ws: WebSocket;

	const gatewayPort = 3346;
	const wsUrl = `ws://localhost:${gatewayPort}`;
	const testMessage =
		'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0Y' +
		'S0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN' +
		'0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

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

	const delay = (ms: number) =>
		new Promise((resolve) => {
			setTimeout(resolve, ms);
		});

	const getMessage = () => new TextEncoder().encode(testMessage);

	beforeAll(async () => {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const testingModule = await Test.createTestingModule({
			imports,
			providers: [TldrawWs],
		}).compile();
		gateway = testingModule.get<TldrawWs>(TldrawWs);
		app = testingModule.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		jest.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] });
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('when tldraw is correctly setup', () => {
		const setup = async () => {
			const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
			jest.spyOn(Uint8Array.prototype, 'reduce').mockReturnValueOnce(1);

			await setupWs('TEST');

			const { buffer } = getMessage();

			return { handleConnectionSpy, buffer };
		};

		it(`should handle connection and data transfer`, async () => {
			const { handleConnectionSpy, buffer } = await setup();
			ws.send(buffer, () => {});

			expect(handleConnectionSpy).toHaveBeenCalled();
			expect(handleConnectionSpy).toHaveBeenCalledTimes(1);

			await delay(2000);
			ws.close();
		});

		it(`check if client will receive message`, async () => {
			const { buffer } = await setup();
			ws.send(buffer, () => {});

			gateway.server.on('connection', (client) => {
				client.on('message', (payload) => {
					expect(payload).toBeInstanceOf(ArrayBuffer);
				});
			});

			await delay(200);
			ws.close();
		});
	});

	describe('when tldraw doc has multiple clients', () => {
		const setup = async () => {
			const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
			await setupWs('TEST2');
			const ws2 = new WebSocket(`${wsUrl}/TEST2`);
			await new Promise((resolve) => {
				ws2.on('open', resolve);
			});

			const { buffer } = getMessage();

			return {
				handleConnectionSpy,
				ws2,
				buffer,
			};
		};

		it(`should handle 2 connections at same doc and data transfer`, async () => {
			const { handleConnectionSpy, ws2, buffer } = await setup();
			ws.send(buffer);
			ws2.send(buffer);

			expect(handleConnectionSpy).toHaveBeenCalled();
			expect(handleConnectionSpy).toHaveBeenCalledTimes(2);

			await delay(200);
			ws.close();
			ws2.close();
		}, 120000);
	});

	describe('when tldraw is not correctly setup', () => {
		const setup = async () => {
			const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');

			await setupWs();

			return {
				handleConnectionSpy,
			};
		};

		it(`should refuse connection if there is no docName`, async () => {
			const { handleConnectionSpy } = await setup();

			const { buffer } = getMessage();
			ws.send(buffer);

			expect(gateway.server).toBeDefined();
			expect(handleConnectionSpy).toHaveBeenCalled();
			expect(handleConnectionSpy).toHaveBeenCalledTimes(1);

			await delay(200);
			ws.close();
		});
	});
});
