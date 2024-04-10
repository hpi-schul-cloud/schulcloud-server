import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';
import { SocketGateway } from './socket.gateway';

describe('SocketGateway', () => {
	let gateway: SocketGateway;
	let app: INestApplication;
	let ioClient: Socket;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			providers: [SocketGateway],
		}).compile();
		app = testingModule.createNestApplication();

		gateway = app.get<SocketGateway>(SocketGateway);

		ioClient = io('http://localhost:3000', {
			autoConnect: false,
			transports: ['websocket', 'polling'],
		});

		await app.listen(3000);
	});

	afterAll(async () => {
		await app.close();
	});

	it('should be defined', () => {
		expect(gateway).toBeDefined();
	});

	it('should emit "pong" on "ping"', async () => {
		ioClient.connect();
		ioClient.emit('lock-card-request', 'Hello world!');
		await new Promise<void>((resolve) => {
			ioClient.on('connect', () => {
				console.log('connected');
			});
			ioClient.on('lock-card-success', (data) => {
				expect(data).toBe('Hello world!');
				resolve();
			});
		});
		ioClient.disconnect();
	});
});
