import { INestApplication } from '@nestjs/common';
import { TldrawGateway } from '@src/modules/tldraw/gateway';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { TextEncoder } from "util";
import { WebSocket } from "ws";

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
	let ws,  app;
	const clientPort = '3346';

	afterEach(async function () {
		await app.close();
	});

	it(`should handle message (2nd port)`, async () => {
		app = await createNestApp();
		await app.listen(3345);

		var encoder = new TextEncoder();
		const clientMessage = encoder.encode(message); // Mock message data

		ws = new WebSocket('ws://localhost:3346');
		await new Promise(resolve => ws.on('open', resolve));

		ws.send(clientMessage);

		await new Promise<void>(resolve =>
			ws.on('message', response => {
				expect(response).toBeInstanceOf(Object);
				ws.close();
				resolve();
			}),
		);
	});
});
