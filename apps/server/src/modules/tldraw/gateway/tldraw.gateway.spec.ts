import { Test, TestingModule } from '@nestjs/testing';
import { TldrawGateway } from '../gateway';
import { createMock } from '@golevelup/ts-jest';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs'

describe('TldrawGateway', () => {
	let gateway: TldrawGateway;
	let clientSocket: WebsocketProvider;
	let app;
	let address;
	let doc;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: TldrawGateway,
					useValue: createMock<TldrawGateway>()
				}],
		}).compile();
		app = module.createNestApplication();
		await app.init();
		address = app.getHttpServer().listen().address();
		gateway = module.get<TldrawGateway>(TldrawGateway);
		doc = new Y.Doc()
		clientSocket = new WebsocketProvider(`ws://localhost:${address.port}`, 'testRommname', doc, { WebSocketPolyfill: require('ws') })
	});

	afterEach(async function () {
		await app.close();
		await clientSocket.disconnect();
	});

	it('should be defined', () => {
		expect(gateway).toBeDefined();
	});

	it('should handle connection', () => {
		const handleConnectionSpy = jest.spyOn(gateway, 'handleConnection');
		const message = { text: 'Hello, world!' };
		gateway.handleConnection(clientSocket, message);
		expect(handleConnectionSpy).toHaveBeenCalledWith(clientSocket, message);
	});
});
