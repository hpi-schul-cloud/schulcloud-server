import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';

import { LocalAuthorizationBodyParams } from '@modules/authentication/controllers/dto';
import { User } from '@shared/domain/entity';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { accountFactory } from './factory/account.factory';

export async function waitForEvent(socket: Socket, eventName: string): Promise<unknown> {
	return new Promise((resolve) => {
		socket.on(eventName, (data: unknown) => {
			resolve(data);
		});
	});
}

export async function getSocketApiClient(app: INestApplication, user: User) {
	const em = app.get<EntityManager>(EntityManager);
	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';
	const account = accountFactory.buildWithId({
		userId: user.id,
		username: user.email,
		password: defaultPasswordHash,
	});

	await em.persistAndFlush([account]);

	const params: LocalAuthorizationBodyParams = {
		username: user.email,
		password: defaultPassword,
	};
	const response = await request(app.getHttpServer()).post(`/authentication/local`).send(params).expect(200);
	const jwt = (response.body as { accessToken: string }).accessToken;

	const url = await app.getUrl();

	const ioClient = io(url, {
		autoConnect: false,
		path: '/board-collaboration',
		transports: ['websocket', 'polling'],
		extraHeaders: {
			Cookie: `jwt=${jwt}`,
		},
	});

	ioClient.connect();

	return ioClient;
}
