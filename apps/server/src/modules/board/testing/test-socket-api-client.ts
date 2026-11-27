import { type INestApplication } from '@nestjs/common';
import { type Socket, io } from 'socket.io-client';
import { BOARD_CONFIG_TOKEN, type BoardConfig } from '../board.config';

export function waitForEvent(socket: Socket, eventName: string): Promise<unknown> {
	return new Promise((resolve) => {
		socket.on(eventName, (data: unknown) => {
			resolve(data);
		});
	});
}

export async function getSocketApiClient(
	app: INestApplication,
	authValue?: string,
	origin?: string | null
): Promise<Socket> {
	const url = await app.getUrl();
	const boardConfig = app.get<BoardConfig>(BOARD_CONFIG_TOKEN);
	const resolvedOrigin = origin === undefined ? boardConfig.hostUrl : origin;

	const extraHeaders: Record<string, string> = {
		Cookie: `jwt=${authValue || ''}`,
	};
	if (resolvedOrigin !== null) {
		extraHeaders.Origin = resolvedOrigin;
	}

	const ioClient = io(url, {
		autoConnect: false,
		path: '/board-collaboration',
		transports: ['websocket', 'polling'],
		extraHeaders,
	});

	ioClient.connect();

	return ioClient;
}
