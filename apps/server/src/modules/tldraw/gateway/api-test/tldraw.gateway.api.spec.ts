import { INestApplication } from '@nestjs/common';
import { TldrawGateway } from '@src/modules/tldraw/gateway';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { TextEncoder } from "util";

const io = require('socket.io-client');

async function createNestApp(): Promise<INestApplication> {
	const testingModule = await Test.createTestingModule({
		providers: [TldrawGateway],
	}).compile();
	const app = testingModule.createNestApplication();
	app.useWebSocketAdapter(new WsAdapter(app) as any);
	return app;
}

const message = 'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0YS0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';


describe("my awesome project", ()  => {
	let wsClient,  app;
	const clientPort = '3346';

	afterEach(async function () {
		await app.close();
	});

	it(`should handle message (2nd port)`, async () => {
		app = await createNestApp();
		await app.listen(3345);
		const options = {
			transports: ['websocket'],
			forceNew: true,
		};
		var encoder = new TextEncoder();
		const clientMessage = encoder.encode(message); // Mock message data

		wsClient = io('ws://localhost:3345', options);

		wsClient.on('connect', () => {
			expect(wsClient.connected).toBeTruthy();
			console.log('Connected to the Socket.io server.');
			wsClient.disconnect(); // Disconnect the client after the test is done
		});

		// wsClient.on('message', (data) => {
		// 	console.log('Received message:', data);
		// 	expect(data).toBeInstanceOf(Object);
		//
		// 	wsClient.close();
		// });

		// await new Promise<void>(resolve =>
		// 	ws.on('message', response => {
		// 		expect(response).toBeInstanceOf(Object);
		// 		ws.close();
		// 		resolve();
		// 	}),
		// );

	});
});
