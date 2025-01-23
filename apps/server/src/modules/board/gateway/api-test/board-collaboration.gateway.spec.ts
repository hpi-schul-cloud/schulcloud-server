import { MongoIoAdapter } from '@infra/socketio';
import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { cleanupCollections } from '@testing/cleanup-collections';
import { courseFactory } from '@testing/factory/course.factory';
import { JwtAuthenticationFactory } from '@testing/factory/jwt-authentication.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { getSocketApiClient, waitForEvent } from '@testing/test-socket-api-client';
import { Socket } from 'socket.io-client';
import { BoardCollaborationTestModule } from '../../board-collaboration.app.module';
import { BoardExternalReferenceType, BoardLayout, CardProps, ContentElementType } from '../../domain';
import {
	cardEntityFactory,
	columnBoardEntityFactory,
	columnEntityFactory,
	richTextElementEntityFactory,
} from '../../testing';
import { BoardCollaborationGateway } from '../board-collaboration.gateway';

describe(BoardCollaborationGateway.name, () => {
	let app: INestApplication;
	let ioClient: Socket;
	let unauthorizedIoClient: Socket;
	let em: EntityManager;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [BoardCollaborationTestModule],
		}).compile();
		app = testingModule.createNestApplication();

		em = app.get(EntityManager);
		const mongoUrl = em.config.getClientUrl();

		const mongoIoAdapter = new MongoIoAdapter(app);
		await mongoIoAdapter.connectToMongoDb(mongoUrl);
		app.useWebSocketAdapter(mongoIoAdapter);
		await app.init();

		await app.listen(0);
	});

	afterAll(async () => {
		ioClient.disconnect();
		unauthorizedIoClient.disconnect();
		await app.close();
	});

	const setup = async () => {
		await cleanupCollections(em);
		const school = schoolEntityFactory.build();
		const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });

		const teacherAuthJwt = JwtAuthenticationFactory.createJwt({
			accountId: teacherAccount.id,
			userId: teacherUser.id,
			schoolId: teacherUser.school.id,
			roles: [teacherUser.roles[0].id],
			support: false,
			isExternalUser: false,
		});

		const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });

		const studentAuthJwt = JwtAuthenticationFactory.createJwt({
			accountId: studentAccount.id,
			userId: studentUser.id,
			schoolId: studentUser.school.id,
			roles: [studentUser.roles[0].id],
			support: false,
			isExternalUser: false,
		});

		const course = courseFactory.build({ teachers: [teacherUser] });
		await em.persistAndFlush([teacherUser, teacherAccount, studentUser, studentAccount, course]);

		ioClient = await getSocketApiClient(app, teacherAuthJwt);
		unauthorizedIoClient = await getSocketApiClient(app, studentAuthJwt);

		const columnBoardNode = columnBoardEntityFactory.buildWithId({
			context: { id: course.id, type: BoardExternalReferenceType.Course },
		});

		const columnNode = columnEntityFactory.withParent(columnBoardNode).build();
		const columnNode2 = columnEntityFactory.withParent(columnBoardNode).build();

		const cardNodes = [
			cardEntityFactory.withParent(columnNode).build(),
			cardEntityFactory.withParent(columnNode).build(),
		];
		const elementNodes = richTextElementEntityFactory.withParent(cardNodes[0]).buildList(3);

		await em.persistAndFlush([columnBoardNode, columnNode, columnNode2, ...cardNodes, ...elementNodes]);

		em.clear();

		return { columnBoardNode, columnNode, columnNode2, cardNodes, elementNodes };
	};

	describe('validation errors', () => {
		it('should answer with failure', async () => {
			await setup();
			ioClient.emit('create-card-request', { columnId: 'invalid' });

			const failure = await waitForEvent(ioClient, 'exception');

			expect(failure).toBeDefined();
		});
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnNode } = await setup();

				unauthorizedIoClient.emit('create-card-request', { columnId: columnNode.id });
				const failure = await waitForEvent(unauthorizedIoClient, 'create-card-failure');

				expect(failure).toEqual({ columnId: columnNode.id });
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				unauthorizedIoClient.emit('fetch-board-request', { boardId });
				const failure = await waitForEvent(unauthorizedIoClient, 'fetch-board-failure');

				expect(failure).toEqual({ boardId });
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
					fromColumnIndex: 0,
					toColumnIndex: 1,
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
					fromColumnIndex: 0,
					toColumnIndex: 0,
					toColumnId: columnNode.id,
				};

				ioClient.emit('move-card-request', moveCardProps);
				const success = await waitForEvent(ioClient, 'move-card-success');

				expect(success).toEqual(expect.objectContaining(moveCardProps));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnNode, cardNodes } = await setup();

				const moveCardProps = {
					cardId: cardNodes[0].id,
					oldIndex: 0,
					newIndex: 1,
					fromColumnId: columnNode.id,
					fromColumnIndex: 0,
					toColumnIndex: 0,
					toColumnId: columnNode.id,
				};

				unauthorizedIoClient.emit('move-card-request', moveCardProps);
				const failure = await waitForEvent(unauthorizedIoClient, 'move-card-failure');

				expect(failure).toEqual(moveCardProps);
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnNode } = await setup();
				const updateColumnProps = { columnId: columnNode.id, newTitle: 'new title' };

				unauthorizedIoClient.emit('update-column-title-request', updateColumnProps);
				const failure = await waitForEvent(unauthorizedIoClient, 'update-column-title-failure');

				expect(failure).toEqual(updateColumnProps);
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				unauthorizedIoClient.emit('delete-board-request', { boardId });
				const failure = await waitForEvent(unauthorizedIoClient, 'delete-board-failure');

				expect(failure).toEqual({ boardId });
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				unauthorizedIoClient.emit('update-board-title-request', { boardId, newTitle: 'new title' });
				const failure = await waitForEvent(unauthorizedIoClient, 'update-board-title-failure');

				expect(failure).toBeDefined();
				expect(failure).toEqual({ boardId, newTitle: 'new title' });
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				unauthorizedIoClient.emit('create-column-request', { boardId });
				const failure = await waitForEvent(unauthorizedIoClient, 'create-column-failure');

				expect(failure).toEqual({ boardId });
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

				expect(success).toEqual(expect.objectContaining({ boardId, isVisible: false }));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				unauthorizedIoClient.emit('update-board-visibility-request', { boardId, isVisible: false });
				const failure = await waitForEvent(unauthorizedIoClient, 'update-board-visibility-failure');

				expect(failure).toEqual({ boardId, isVisible: false });
			});
		});
	});

	describe('update board layout', () => {
		describe('when board exists', () => {
			it('should answer with success', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				ioClient.emit('update-board-layout-request', { boardId, layout: BoardLayout.LIST });
				const success = await waitForEvent(ioClient, 'update-board-layout-success');

				expect(success).toEqual(expect.objectContaining({ boardId, layout: BoardLayout.LIST }));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();
				const boardId = columnBoardNode.id;

				unauthorizedIoClient.emit('update-board-layout-request', { boardId, layout: BoardLayout.LIST });
				const failure = await waitForEvent(unauthorizedIoClient, 'update-board-layout-failure');

				expect(failure).toEqual({ boardId, layout: BoardLayout.LIST });
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

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnNode } = await setup();
				const columnId = columnNode.id;

				unauthorizedIoClient.emit('delete-column-request', { columnId });
				const failure = await waitForEvent(unauthorizedIoClient, 'delete-column-failure');

				expect(failure).toEqual({ columnId });
			});
		});
	});

	describe('move column', () => {
		describe('when column does exist', () => {
			it('should answer with success', async () => {
				const { columnBoardNode, columnNode } = await setup();

				const payload = {
					targetBoardId: columnBoardNode.id,
					columnMove: {
						addedIndex: 1,
						removedIndex: 0,
						columnId: columnNode.id,
					},
				};

				ioClient.emit('move-column-request', payload);
				const success = await waitForEvent(ioClient, 'move-column-success');

				expect(success).toEqual(expect.objectContaining(payload));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode, columnNode } = await setup();

				const payload = {
					targetBoardId: columnBoardNode.id,
					columnMove: {
						addedIndex: 1,
						removedIndex: 0,
						columnId: columnNode.id,
					},
				};

				unauthorizedIoClient.emit('move-column-request', payload);
				const failure = await waitForEvent(unauthorizedIoClient, 'move-column-failure');

				expect(failure).toEqual(payload);
			});
		});
	});

	describe('update card title', () => {
		describe('when card exists', () => {
			it('should answer with success', async () => {
				const { cardNodes } = await setup();
				const cardId = cardNodes[0].id;

				ioClient.emit('update-card-title-request', { cardId, newTitle: 'new title' });
				const success = await waitForEvent(ioClient, 'update-card-title-success');

				expect(success).toEqual(expect.objectContaining({ cardId }));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { cardNodes } = await setup();
				const payload = { cardId: cardNodes[0].id, newTitle: 'new title' };

				unauthorizedIoClient.emit('update-card-title-request', payload);
				const failure = await waitForEvent(unauthorizedIoClient, 'update-card-title-failure');

				expect(failure).toEqual(payload);
			});
		});
	});

	describe('update card height', () => {
		describe('when card exists', () => {
			it('should answer with success', async () => {
				const { cardNodes } = await setup();
				const cardId = cardNodes[0].id;
				const newHeight = 200;

				ioClient.emit('update-card-height-request', { cardId, newHeight });
				const success = await waitForEvent(ioClient, 'update-card-height-success');

				expect(success).toEqual(expect.objectContaining({ cardId, newHeight }));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { cardNodes } = await setup();
				const cardId = cardNodes[0].id;
				const newHeight = 200;

				unauthorizedIoClient.emit('update-card-height-request', { cardId, newHeight });
				const failure = await waitForEvent(unauthorizedIoClient, 'update-card-height-failure');

				expect(failure).toEqual({ cardId, newHeight });
			});
		});
	});

	describe('fetch card', () => {
		describe('when card exists', () => {
			it('should answer with success', async () => {
				const { cardNodes } = await setup();
				const cardIds = cardNodes.map((card) => card.id);

				ioClient.emit('fetch-card-request', { cardIds });
				const success = (await waitForEvent(ioClient, 'fetch-card-success')) as { cards: { title: string }[] };

				expect(success.cards[1]?.title).toEqual(cardNodes[1].title);
			});
		});

		describe('when user is not authorized', () => {
			it('should not return any cards', async () => {
				const { cardNodes } = await setup();
				const cardIds = cardNodes.map((card) => card.id);

				unauthorizedIoClient.emit('fetch-card-request', { cardIds });

				const success = (await waitForEvent(unauthorizedIoClient, 'fetch-card-success')) as {
					cards: { title: string }[];
				};

				expect(success.cards.length).toEqual(0);
			});
		});

		describe('when an error is thrown', () => {
			// the error cannot be provoked easily anymore because passing a column id
			// ignores the id now
			it.skip('should answer with failure', async () => {
				const { cardNodes, columnNode } = await setup();

				// passing a column id instead of a card id to force an error
				ioClient.emit('fetch-card-request', { cardIds: [cardNodes[0].id, columnNode.id] });
				const failure = await waitForEvent(ioClient, 'fetch-card-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('delete card', () => {
		describe('when card exists', () => {
			it('should answer with success', async () => {
				const { cardNodes } = await setup();
				const cardId = cardNodes[0].id;

				ioClient.emit('delete-card-request', { cardId });
				const success = await waitForEvent(ioClient, 'delete-card-success');

				expect(success).toEqual(expect.objectContaining({ cardId }));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { cardNodes } = await setup();
				const cardId = cardNodes[0].id;

				unauthorizedIoClient.emit('delete-card-request', { cardId });
				const failure = await waitForEvent(unauthorizedIoClient, 'delete-card-failure');

				expect(failure).toEqual({ cardId });
			});
		});
	});

	describe('create element', () => {
		it('should answer with success', async () => {
			const { cardNodes } = await setup();
			const cardId = cardNodes[1].id;

			ioClient.emit('create-element-request', { cardId, type: ContentElementType.RICH_TEXT });
			const success = (await waitForEvent(ioClient, 'create-element-success')) as {
				cardId: string;
				newElement: unknown;
			};

			expect(Object.keys(success)).toEqual(expect.arrayContaining(['cardId', 'newElement']));
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { cardNodes } = await setup();
				const cardId = cardNodes[1].id;

				unauthorizedIoClient.emit('create-element-request', { cardId, type: ContentElementType.RICH_TEXT });
				const failure = await waitForEvent(unauthorizedIoClient, 'create-element-failure');

				expect(failure).toEqual({ cardId, type: ContentElementType.RICH_TEXT });
			});
		});
	});

	describe('delete element', () => {
		describe('when element exists', () => {
			it('should answer with success', async () => {
				const { cardNodes, elementNodes } = await setup();
				const cardId = cardNodes[0].id;
				const elementId = elementNodes[0].id;

				ioClient.emit('delete-element-request', { cardId, elementId });
				const success = await waitForEvent(ioClient, 'delete-element-success');

				expect(success).toEqual(expect.objectContaining({ cardId, elementId }));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { cardNodes, elementNodes } = await setup();
				const cardId = cardNodes[0].id;
				const elementId = elementNodes[0].id;

				unauthorizedIoClient.emit('delete-element-request', { cardId, elementId });
				const failure = await waitForEvent(unauthorizedIoClient, 'delete-element-failure');

				expect(failure).toEqual({ cardId, elementId });
			});
		});
	});

	describe('update element', () => {
		describe('when element exists', () => {
			it('should answer with success', async () => {
				const { elementNodes } = await setup();
				const elementId = elementNodes[0].id;

				const payload = {
					elementId,
					data: {
						type: ContentElementType.RICH_TEXT,
						content: { text: 'some new text', inputFormat: InputFormat.PLAIN_TEXT },
					},
				};

				ioClient.emit('update-element-request', payload);
				const success = await waitForEvent(ioClient, 'update-element-success');

				expect(success).toEqual(expect.objectContaining(payload));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { elementNodes } = await setup();
				const elementId = elementNodes[0].id;

				const payload = {
					elementId,
					data: {
						type: ContentElementType.RICH_TEXT,
						content: { text: 'some new text', inputFormat: InputFormat.PLAIN_TEXT },
					},
				};

				unauthorizedIoClient.emit('update-element-request', payload);
				const failure = await waitForEvent(unauthorizedIoClient, 'update-element-failure');

				expect(failure).toEqual(payload);
			});
		});
	});

	describe('move element', () => {
		describe('when element exists', () => {
			it('should answer with success', async () => {
				const { cardNodes, elementNodes } = await setup();
				const payload = { elementId: elementNodes[0].id, toCardId: cardNodes[0].id, toPosition: 2 };

				ioClient.emit('move-element-request', payload);
				const success = await waitForEvent(ioClient, 'move-element-success');

				expect(success).toEqual(expect.objectContaining(payload));
			});
		});

		describe('when user is not authorized', () => {
			it('should answer with failure', async () => {
				const { cardNodes, elementNodes } = await setup();
				const payload = { elementId: elementNodes[0].id, toCardId: cardNodes[0].id, toPosition: 2 };

				unauthorizedIoClient.emit('move-element-request', payload);
				const failure = await waitForEvent(unauthorizedIoClient, 'move-element-failure');

				expect(failure).toEqual(payload);
			});
		});
	});
});
