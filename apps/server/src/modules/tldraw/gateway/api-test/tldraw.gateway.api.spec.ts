import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import WebSocket from 'ws';
import { TldrawGateway } from '../tldraw.gateway';
import { TextEncoder } from 'util';
import * as Utils from "../../utils/utils"

const message = 'AZQBAaCbuLANBIsBeyJ0ZFVzZXIiOnsiaWQiOiJkNGIxZThmYi0yMWUwLTQ3ZDAtMDI0Y' +
	'S0zZGEwYjMzNjQ3MjIiLCJjb2xvciI6IiNGMDRGODgiLCJwb2ludCI6WzAsMF0sInNlbGVjdGVkSWRzIjpbXSwiYWN' +
	'0aXZlU2hhcGVzIjpbXSwic2Vzc2lvbiI6ZmFsc2V9fQ==';

describe('WebSocketGateway (WsAdapter)', () => {
	let ws, app;
	let gateway: TldrawGateway;
	let utilsSpy;

	beforeEach(async () => {
		const testingModule = await Test.createTestingModule({
			providers: [TldrawGateway]
		}).compile();
		const testingApp = testingModule.createNestApplication();
		testingApp.useWebSocketAdapter(new WsAdapter(testingApp) as any);

		gateway = testingModule.get<TldrawGateway>(TldrawGateway);
		app = testingApp;

		await app.listen(3335);
		ws = new WebSocket('ws://localhost:3345');
		utilsSpy = jest.spyOn(Utils, 'messageHandler').mockReturnValue();
	});

	afterEach(async function() {
		ws.close();
		await app.close();
	});

	it(`should handle connection and data transfer1`, async () => {
		const messageHandlerSpy = jest.spyOn(gateway, 'handleConnection');

		await new Promise(resolve => ws.on('open', resolve));

		const byteArray = new TextEncoder().encode(message);
		const buffer = byteArray.buffer;

		await ws.send(buffer);

		expect(messageHandlerSpy).toHaveBeenCalled();
		expect(messageHandlerSpy).toHaveBeenCalledTimes(1);

	});

	it(`should handle connection and data transfer2`, async () => {
		jest.mock('../../utils/utils');

		await new Promise(resolve => ws.on('open', resolve));

		const byteArray = new TextEncoder().encode(message);
		const buffer = byteArray.buffer;

		await ws.send(buffer);

		expect(utilsSpy).toHaveBeenCalled();
		expect(utilsSpy).toHaveBeenCalledTimes(1);
		ws.close();
	});

});
