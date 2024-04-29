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
		const columnNode2 = columnNodeFactory.buildWithId({ parent: columnBoardNode });

		const cardNodes = cardNodeFactory.buildList(2, { parent: columnNode });

		await em.persistAndFlush([columnBoardNode, columnNode, columnNode2, ...cardNodes]);
		em.clear();

		return { user, columnBoardNode, columnNode, columnNode2, cardNodes };
	};

	it('should be defined', () => {
		expect(gateway).toBeDefined();
	});

	describe('create card', () => {
		describe('when column exists', () => {
			it('should answer with new card', async () => {
				const { user, columnNode } = await setup();
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('create-card-request', { columnId: columnNode.id });
				const success = (await waitForEvent(ioClient, 'create-card-success')) as {
					columnId: string;
					newCard: CardProps;
				};

				expect(Object.keys(success)).toEqual(expect.arrayContaining(['columnId', 'newCard']));
			});
		});
		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('create-card-request', { columnId: 'non-existing-column' });
				const failure = await waitForEvent(ioClient, 'create-card-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('fetch board', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { user, columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('fetch-board-request', { boardId });
				const success = await waitForEvent(ioClient, 'fetch-board-success');

				expect(success).toEqual(expect.objectContaining({ id: boardId }));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				const boardId = 'non-existing-id';
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('fetch-board-request', { boardId });
				const failure = await waitForEvent(ioClient, 'fetch-board-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('move card', () => {
		describe('when moving card to another column', () => {
			it('should answer with success', async () => {
				const { user, columnNode, columnNode2, cardNodes } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const moveCardProps = {
					cardId: cardNodes[0].id,
					oldIndex: 0,
					newIndex: 0,
					fromColumnId: columnNode.id,
					toColumnId: columnNode2.id,
				};

				ioClient.emit('move-card-request', moveCardProps);
				const success = await waitForEvent(ioClient, 'move-card-success');

				expect(success).toEqual(expect.objectContaining({ toColumnId: columnNode2.id }));
			});
		});

		describe('when moving card to another index in the same column', () => {
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

		describe('when trying to move a non existing card', () => {
			it('should answer with failure', async () => {
				const { user, columnNode } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const moveCardProps = {
					cardId: 'non-existing-card',
					oldIndex: 0,
					newIndex: 1,
					fromColumnId: columnNode.id,
					toColumnId: columnNode.id,
				};

				ioClient.emit('move-card-request', moveCardProps);
				const failure = await waitForEvent(ioClient, 'move-card-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('update column title', () => {
		describe('when column exists', () => {
			it('should answer with success', async () => {
				const { user, columnNode } = await setup();
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('update-column-title-request', { columnId: columnNode.id, newTitle: 'new title' });
				const success = await waitForEvent(ioClient, 'update-column-title-success');

				expect(success).toEqual(expect.objectContaining({ columnId: columnNode.id }));
			});
		});

		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('update-column-title-request', { columnId: 'non-existing-id', newTitle: 'new title' });
				const failure = await waitForEvent(ioClient, 'update-column-title-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('delete board', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { user, columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('delete-board-request', { boardId });
				const success = await waitForEvent(ioClient, 'delete-board-success');

				expect(success).toEqual(expect.objectContaining({ boardId }));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				const boardId = 'non-existing-id';
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('delete-board-request', { boardId });
				const failure = await waitForEvent(ioClient, 'delete-board-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('update board title', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { user, columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('update-board-title-request', { boardId, newTitle: 'new title' });
				const success = await waitForEvent(ioClient, 'update-board-title-success');

				expect(success).toEqual(expect.objectContaining({ boardId }));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				const boardId = 'non-existing-id';
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('update-board-title-request', { boardId, newTitle: 'new title' });
				const failure = await waitForEvent(ioClient, 'update-board-title-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('create column', () => {
		describe('when board exists', () => {
			it('should answer with new column', async () => {
				const { user, columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('create-column-request', { boardId });
				const success = (await waitForEvent(ioClient, 'create-column-success')) as Record<string, unknown>;

				expect(Object.keys(success)).toEqual(expect.arrayContaining(['boardId', 'newColumn']));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				const boardId = 'non-existing-id';
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('create-column-request', { boardId });
				const failure = await waitForEvent(ioClient, 'create-column-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('update board visibility', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { user, columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('update-board-visibility-request', { boardId, isVisible: false });
				const success = await waitForEvent(ioClient, 'update-board-visibility-success');

				expect(success).toBeDefined();
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				const boardId = 'non-existing-id';
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('update-board-visibility-request', { boardId, isVisible: false });
				const failure = await waitForEvent(ioClient, 'update-board-visibility-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('delete column', () => {
		describe('when column exists', () => {
			it('should answer with success', async () => {
				const { user, columnNode } = await setup();
				const columnId = columnNode.id;
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('delete-column-request', { columnId });
				const success = await waitForEvent(ioClient, 'delete-column-success');

				expect(success).toEqual(expect.objectContaining({ columnId }));
			});
		});

		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				const { user } = await setup();
				const columnId = 'not-existing-id';
				currentUser = mapUserToCurrentUser(user);

				ioClient.emit('delete-column-request', { columnId });
				const failure = await waitForEvent(ioClient, 'delete-column-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('move column', () => {
		describe('when column does exist', () => {
			it('should answer with success', async () => {
				const { user, columnBoardNode, columnNode } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const moveColumnProps = {
					columnId: columnNode.id,
					targetBoardId: columnBoardNode.id,
					newIndex: 1,
					columnMove: {
						addedIndex: 1,
						removedIndex: 0,
						columnId: columnNode.id,
					},
				};

				ioClient.emit('move-column-request', moveColumnProps);
				const success = await waitForEvent(ioClient, 'move-column-success');

				expect(success).toEqual(expect.objectContaining(moveColumnProps));
			});
		});
		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				const { user, columnBoardNode } = await setup();
				currentUser = mapUserToCurrentUser(user);

				const moveColumnProps = {
					columnId: 'non-existing-id',
					targetBoardId: columnBoardNode.id,
					newIndex: 1,
					columnMove: {
						addedIndex: 1,
						removedIndex: 0,
						columnId: 'non-existing-id',
					},
				};

				ioClient.emit('move-column-request', moveColumnProps);
				const failure = await waitForEvent(ioClient, 'move-column-failure');

				expect(failure).toBeDefined();
			});
		});
	});
});
