import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { BoardExternalReferenceType, CardProps } from '@shared/domain/domainobject';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	userFactory,
} from '@shared/testing';
import { getSocketApiClient, waitForEvent } from '@shared/testing/test-socket-api-client';
import { Socket } from 'socket.io-client';
import { BoardCollaborationTestingModule } from '../../board-collaboration.testing.module';
import { SocketGateway } from '../socket.gateway';

describe('SocketGateway', () => {
	let gateway: SocketGateway;
	let app: INestApplication;
	let ioClient: Socket;
	let em: EntityManager;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [BoardCollaborationTestingModule],
		}).compile();
		app = testingModule.createNestApplication();

		em = app.get<EntityManager>(EntityManager);
		gateway = app.get<SocketGateway>(SocketGateway);

		await app.listen(0);
	});

	afterAll(async () => {
		ioClient.disconnect();
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const user = userFactory.buildWithId();

		const course = courseFactory.build({ teachers: [user] });
		await em.persistAndFlush([user, course]);

		ioClient = await getSocketApiClient(app, user);

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
				const { columnNode } = await setup();

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
				await setup();

				ioClient.emit('create-card-request', { columnId: 'non-existing-column' });
				const failure = await waitForEvent(ioClient, 'create-card-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('fetch board', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				ioClient.emit('fetch-board-request', { boardId });
				const success = await waitForEvent(ioClient, 'fetch-board-success');

				expect(success).toEqual(expect.objectContaining({ id: boardId }));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const boardId = 'non-existing-id';

				ioClient.emit('fetch-board-request', { boardId });
				const failure = await waitForEvent(ioClient, 'fetch-board-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('move card', () => {
		describe('when moving card to another column', () => {
			it('should answer with success', async () => {
				const { columnNode, columnNode2, cardNodes } = await setup();

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
				const { columnNode, cardNodes } = await setup();

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
				const { columnNode } = await setup();

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
				const { columnNode } = await setup();

				ioClient.emit('update-column-title-request', { columnId: columnNode.id, newTitle: 'new title' });
				const success = await waitForEvent(ioClient, 'update-column-title-success');

				expect(success).toEqual(expect.objectContaining({ columnId: columnNode.id }));
			});
		});

		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				await setup();

				ioClient.emit('update-column-title-request', { columnId: 'non-existing-id', newTitle: 'new title' });
				const failure = await waitForEvent(ioClient, 'update-column-title-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('delete board', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				ioClient.emit('delete-board-request', { boardId });
				const success = await waitForEvent(ioClient, 'delete-board-success');

				expect(success).toEqual(expect.objectContaining({ boardId }));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const boardId = 'non-existing-id';

				ioClient.emit('delete-board-request', { boardId });
				const failure = await waitForEvent(ioClient, 'delete-board-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('update board title', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				ioClient.emit('update-board-title-request', { boardId, newTitle: 'new title' });
				const success = await waitForEvent(ioClient, 'update-board-title-success');

				expect(success).toEqual(expect.objectContaining({ boardId }));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const boardId = 'non-existing-id';

				ioClient.emit('update-board-title-request', { boardId, newTitle: 'new title' });
				const failure = await waitForEvent(ioClient, 'update-board-title-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('create column', () => {
		describe('when board exists', () => {
			it('should answer with new column', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				ioClient.emit('create-column-request', { boardId });
				const success = (await waitForEvent(ioClient, 'create-column-success')) as Record<string, unknown>;

				expect(Object.keys(success)).toEqual(expect.arrayContaining(['boardId', 'newColumn']));
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const boardId = 'non-existing-id';

				ioClient.emit('create-column-request', { boardId });
				const failure = await waitForEvent(ioClient, 'create-column-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('update board visibility', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				ioClient.emit('update-board-visibility-request', { boardId, isVisible: false });
				const success = await waitForEvent(ioClient, 'update-board-visibility-success');

				expect(success).toBeDefined();
			});
		});

		describe('when board does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const boardId = 'non-existing-id';

				ioClient.emit('update-board-visibility-request', { boardId, isVisible: false });
				const failure = await waitForEvent(ioClient, 'update-board-visibility-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('delete column', () => {
		describe('when column exists', () => {
			it('should answer with success', async () => {
				const { columnNode } = await setup();
				const columnId = columnNode.id;

				ioClient.emit('delete-column-request', { columnId });
				const success = await waitForEvent(ioClient, 'delete-column-success');

				expect(success).toEqual(expect.objectContaining({ columnId }));
			});
		});

		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const columnId = 'not-existing-id';

				ioClient.emit('delete-column-request', { columnId });
				const failure = await waitForEvent(ioClient, 'delete-column-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('move column', () => {
		describe('when column does exist', () => {
			it('should answer with success', async () => {
				const { columnBoardNode, columnNode } = await setup();

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
				const { columnBoardNode } = await setup();

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
