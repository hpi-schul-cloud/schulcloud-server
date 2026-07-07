import { type INestApplication } from '@nestjs/common';
import { type Socket, io } from 'socket.io-client';

export function waitForEvent(socket: Socket, eventName: string): Promise<unknown> {
	return new Promise((resolve) => {
		socket.on(eventName, (data: unknown) => {
			resolve(data);
		});
	});
}

export async function getSocketApiClient(app: INestApplication, authValue?: string): Promise<Socket> {
	const url = await app.getUrl();

	const ioClient = io(url, {
		autoConnect: false,
		path: '/board-collaboration',
		transports: ['websocket', 'polling'],
		extraHeaders: {
			Cookie: `jwt=${authValue || ''}`,
		},
	});

	ioClient.connect();

	return ioClient;
}
