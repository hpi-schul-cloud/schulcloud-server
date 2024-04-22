import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { BoardExternalReferenceType, CardProps } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	mapUserToCurrentUser,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { WsJwtAuthGuard } from '@src/modules/authentication/guard/ws-jwt-auth.guard';
import { Request } from 'express';
import { Socket, io } from 'socket.io-client';
import { BoardCollaborationTestingModule } from '../../board-collaboration.testing.module';
import { SocketGateway } from '../socket.gateway';

async function waitForEvent(socket: Socket, eventName: string): Promise<unknown> {
	return new Promise((resolve) => {
		socket.on(eventName, (data: unknown) => {
			resolve(data);
		});
	});
}

describe('SocketGateway', () => {
	let gateway: SocketGateway;
	let app: INestApplication;
	let ioClient: Socket;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [BoardCollaborationTestingModule],
		})
			.overrideGuard(WsJwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const req: Request = context.switchToWs().getClient().handshake;
					req.user = currentUser;
					return true;
				},
			})
			.compile();
		app = testingModule.createNestApplication();

		em = app.get<EntityManager>(EntityManager);
		gateway = app.get<SocketGateway>(SocketGateway);

		/* client = new TestSocketClient(app); */

		ioClient = io('http://localhost:3031', {
			autoConnect: false,
			path: '/collaboration',
			transports: ['websocket', 'polling'],
		});
		ioClient.connect();

		await app.listen(3031);
	});

	afterAll(async () => {
		ioClient.disconnect();
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.build();
		currentUser = mapUserToCurrentUser(user);

		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		const columnBoardNode = columnBoardNodeFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnNodeFactory.buildWithId({ parent: columnBoardNode });

		const cardNodes = cardNodeFactory.buildList(2, { parent: columnNode });

		await em.persistAndFlush([columnBoardNode, columnNode, ...cardNodes]);
		em.clear();

		return { user, columnBoardNode, columnNode, cardNodes };
	};

	it('should be defined', () => {
		expect(gateway).toBeDefined();
	});

	describe('create card', () => {
		it('should answer with new card', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			ioClient.emit('create-card-request', { columnId: columnNode.id });
			const success = (await waitForEvent(ioClient, 'create-card-success')) as { columnId: string; newCard: CardProps };

			expect(Object.keys(success)).toEqual(expect.arrayContaining(['columnId', 'newCard']));
		});
	});

	describe('move card', () => {
		it('should answer with success', async () => {
			const { user, columnNode, cardNodes } = await setup();
			currentUser = mapUserToCurrentUser(user);

			const moveCardProps = {
				cardId: cardNodes[0].id,
				oldIndex: 0,
				newIndex: 1,
				fromColumnId: columnNode.id,
				toColumnId: columnNode.id,
			};

			ioClient.emit('move-card-request', moveCardProps);
			const success = await waitForEvent(ioClient, 'move-card-success');

			expect(success).toEqual(expect.objectContaining(moveCardProps));
		});
	});

	describe('update column title', () => {
		it('should answer with success', async () => {
			const { user, columnNode } = await setup();
			currentUser = mapUserToCurrentUser(user);

			ioClient.emit('update-column-title-request', { columnId: columnNode.id, newTitle: 'new title' });
			const success = await waitForEvent(ioClient, 'update-column-title-success');

			expect(success).toEqual(expect.objectContaining({ columnId: columnNode.id }));
		});
	});

	describe('delete column', () => {
		it('should answer with success', async () => {
			const { user, columnNode } = await setup();
			const columnId = columnNode.id;
			currentUser = mapUserToCurrentUser(user);

			ioClient.emit('delete-column-request', { columnId });
			const success = await waitForEvent(ioClient, 'delete-column-success');

			expect(success).toEqual(expect.objectContaining({ columnId }));
		});
	});
});
