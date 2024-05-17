import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { BoardExternalReferenceType, CardProps, ContentElementType } from '@shared/domain/domainobject';
import { InputFormat } from '@shared/domain/types';
import {
	cardNodeFactory,
	cleanupCollections,
	columnBoardNodeFactory,
	columnNodeFactory,
	courseFactory,
	richTextElementNodeFactory,
	userFactory,
} from '@shared/testing';
import { getSocketApiClient, waitForEvent } from '@shared/testing/test-socket-api-client';
import { Socket } from 'socket.io-client';
import { BoardCollaborationTestingModule } from '../../board-collaboration.testing.module';
import { BoardCollaborationGateway } from '../board-collaboration.gateway';

describe(BoardCollaborationGateway.name, () => {
	let ws: BoardCollaborationGateway;
	let app: INestApplication;
	let ioClient: Socket;
	let em: EntityManager;

	beforeAll(async () => {
		const testingModule = await Test.createTestingModule({
			imports: [BoardCollaborationTestingModule],
		}).compile();
		app = testingModule.createNestApplication();

		em = app.get(EntityManager);
		ws = app.get(BoardCollaborationGateway);

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

		const cardNodes = cardNodeFactory.buildListWithId(2, { parent: columnNode });
		const elementNodes = richTextElementNodeFactory.buildListWithId(3, { parent: cardNodes[0] });

		await em.persistAndFlush([columnBoardNode, columnNode, columnNode2, ...cardNodes, ...elementNodes]);

		em.clear();

		return { user, columnBoardNode, columnNode, columnNode2, cardNodes, elementNodes };
	};

	it('should be defined', () => {
		expect(ws).toBeDefined();
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

				ioClient.emit('create-card-request', { columnId: new ObjectId().toHexString() });
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
				const boardId = new ObjectId().toHexString();

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
					newIndex: 1,
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
					cardId: new ObjectId().toHexString(),
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

				ioClient.emit('update-column-title-request', { columnId: new ObjectId().toHexString(), newTitle: 'new title' });
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
				const boardId = new ObjectId().toHexString();

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
				const boardId = new ObjectId().toHexString();

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
				const boardId = new ObjectId().toHexString();

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
				const boardId = new ObjectId().toHexString();

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
				const columnId = new ObjectId().toHexString();

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

				expect(success).toEqual(moveColumnProps);
			});
		});
		describe('when column does not exist', () => {
			it('should answer with failure', async () => {
				const { columnBoardNode } = await setup();

				const moveColumnProps = {
					columnId: new ObjectId().toHexString(),
					targetBoardId: columnBoardNode.id,
					newIndex: 1,
					columnMove: {
						addedIndex: 1,
						removedIndex: 0,
						columnId: new ObjectId().toHexString(),
					},
				};

				ioClient.emit('move-column-request', moveColumnProps);
				const failure = await waitForEvent(ioClient, 'move-column-failure');

				expect(failure).toBeDefined();
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

		describe('when card does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const cardId = new ObjectId().toHexString();

				ioClient.emit('update-card-title-request', { cardId, newTitle: 'new title' });
				const failure = await waitForEvent(ioClient, 'update-card-title-failure');

				expect(failure).toBeDefined();
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

		describe('when card does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const cardId = new ObjectId().toHexString();

				ioClient.emit('update-card-height-request', { cardId, newHeight: 200 });
				const failure = await waitForEvent(ioClient, 'update-card-height-failure');

				expect(failure).toBeDefined();
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

		describe('when card does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const cardId = new ObjectId().toHexString();

				ioClient.emit('fetch-card-request', { cardIds: [cardId] });
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

				expect(success).toEqual({ cardId });
			});
		});

		describe('when card does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const cardId = new ObjectId().toHexString();

				ioClient.emit('delete-card-request', { cardId });
				const failure = await waitForEvent(ioClient, 'delete-card-failure');

				expect(failure).toBeDefined();
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

		describe('when card does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const cardId = new ObjectId().toHexString();

				ioClient.emit('create-element-request', { cardId });
				const failure = await waitForEvent(ioClient, 'create-element-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('delete element', () => {
		describe('when element exists', () => {
			it('should answer with success', async () => {
				const { elementNodes } = await setup();
				const elementId = elementNodes[0].id;

				ioClient.emit('delete-element-request', { elementId });
				const success = await waitForEvent(ioClient, 'delete-element-success');

				expect(success).toEqual({ elementId });
			});
		});

		describe('when element does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const elementId = new ObjectId().toHexString();

				ioClient.emit('delete-element-request', { elementId });
				const failure = await waitForEvent(ioClient, 'delete-element-failure');

				expect(failure).toBeDefined();
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

				expect(success).toEqual(payload);
			});
		});

		describe('when element does not exist', () => {
			it('should answer with failure', async () => {
				await setup();
				const elementId = new ObjectId().toHexString();

				ioClient.emit('update-element-request', {
					elementId,
					data: {
						type: ContentElementType.RICH_TEXT,
						content: { text: 'some new text', inputFormat: InputFormat.PLAIN_TEXT },
					},
				});
				const failure = await waitForEvent(ioClient, 'update-element-failure');

				expect(failure).toBeDefined();
			});
		});
	});

	describe('move element', () => {
		describe('when element exists', () => {
			it('should answer with success', async () => {
				const { cardNodes, elementNodes } = await setup();
				const data = { elementId: elementNodes[0].id, toCardId: cardNodes[0].id, toPosition: 2 };

				ioClient.emit('move-element-request', data);
				const success = await waitForEvent(ioClient, 'move-element-success');

				expect(success).toEqual(data);
			});
		});

		describe('when element does not exist', () => {
			it('should answer with failure', async () => {
				const { cardNodes } = await setup();
				const elementId = new ObjectId().toHexString();
				const toCardId = cardNodes[0].id;

				ioClient.emit('move-element-request', { elementId, toCardId, toPosition: 2 });
				const failure = await waitForEvent(ioClient, 'move-element-failure');

				expect(failure).toBeDefined();
			});
		});
	});
});
