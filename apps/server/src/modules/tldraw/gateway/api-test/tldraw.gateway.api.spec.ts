import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { expect } from 'chai';
import WebSocket from 'ws';
import { TldrawGateway } from '../tldraw.gateway';
const encoding = require('lib0/dist/encoding.cjs');


async function createNestApp(...gateways): Promise<INestApplication> {
	const testingModule = await Test.createTestingModule({
		providers: gateways,
	}).compile();
	const app = testingModule.createNestApplication();
	app.useWebSocketAdapter(new WsAdapter(app) as any);
	return app;
}

const message = 'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0YS0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';
const messageSync = 0;

describe('WebSocketGateway (WsAdapter)', () => {
	let ws, app;


	afterEach(async function () {
		await app.close();
	});

	it(`should handle connection and data transfer`, async () => {
		app = await createNestApp(TldrawGateway);
		await app.listen(3336);
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageSync);
		ws = new WebSocket('ws://localhost:3345');
		// await new Promise(resolve => );
		ws.on('open', (resolve) => {
			console.log('resolve');
			console.log(resolve);
		});
		const test = encoding.toUint8Array(encoder);
		ws.send(encoding.toUint8Array(encoder));
		await new Promise<void>(resolve =>
			ws.on('message', data => {
				expect(data).to.be.instanceOf(Uint8Array);
				ws.close();
				resolve();
			}),
		);

	});

});
