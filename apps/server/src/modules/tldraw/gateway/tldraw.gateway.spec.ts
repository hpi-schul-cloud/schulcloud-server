import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { CoreModule } from '@src/core';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { config } from '@src/modules/tldraw/config';
import { TldrawGateway } from '.';

describe('TldrawGateway', () => {
	let gateway: TldrawGateway;
	let clientSocket: WebSocket;
	let app: INestApplication;
	const appPort = 3434;
	const gatewayPort = 3345;

	async function createNestApp(): Promise<void> {
		const imports = [CoreModule, ConfigModule.forRoot(createConfigModuleOptions(config))];
		const module: TestingModule = await Test.createTestingModule({
			imports,
			providers: [
				{
					provide: TldrawGateway,
					useValue: createMock<TldrawGateway>(),
				},
			],
		}).compile();
		app = module.createNestApplication();
		app.useWebSocketAdapter(new WsAdapter(app));
		gateway = module.get<TldrawGateway>(TldrawGateway);
	}

	afterEach(async () => {
		await app.close();
	});

	it('should be defined', async () => {
		await createNestApp();
		await app.listen(appPort);

		expect(gateway).toBeDefined();
	});

	it('should handle connection', async () => {
		await createNestApp();
		await app.listen(appPort);
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
		const message = 'TEST STRING';
		const request = new Request(new URL(`ws://localhost:${gatewayPort}?roomName=TEST`), {
			body: message,
			method: 'POST',
		});
		clientSocket = new WebSocket(`ws://localhost:${gatewayPort}/TEST`);

		gateway.handleConnection(clientSocket, request);
		expect(handleConnectionSpy).toHaveBeenCalledWith(clientSocket, request);
	});
});
