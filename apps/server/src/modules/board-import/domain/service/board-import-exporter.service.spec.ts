import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	type BoardResponse,
	BoardsClientAdapter,
	CardClientAdapter,
	type CardControllerCreateElement201Response,
	type CardListResponse,
	type CardResponse,
	ColumnClientAdapter,
	type ColumnResponse,
} from '@infra/common-cartridge-clients';
import { HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { boardImportJobFactory } from '../../testing';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportTargetType, type BoardPlan, PlannedElementType } from '../type';
import { BoardImportExporterService } from './board-import-exporter.service';
import { type BoardImportUserSession } from './board-import-user-session';

describe(BoardImportExporterService.name, () => {
	let module: TestingModule;
	let service: BoardImportExporterService;
	let repo: DeepMocked<BoardImportJobRepo>;
	let boardsClient: DeepMocked<BoardsClientAdapter>;
	let columnClient: DeepMocked<ColumnClientAdapter>;
	let cardClient: DeepMocked<CardClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportExporterService,
				{ provide: BOARD_IMPORT_JOB_REPO, useValue: createMock<BoardImportJobRepo>() },
				{ provide: BoardsClientAdapter, useValue: createMock<BoardsClientAdapter>() },
				{ provide: ColumnClientAdapter, useValue: createMock<ColumnClientAdapter>() },
				{ provide: CardClientAdapter, useValue: createMock<CardClientAdapter>() },
			],
		}).compile();

		service = module.get(BoardImportExporterService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
		boardsClient = module.get(BoardsClientAdapter);
		columnClient = module.get(ColumnClientAdapter);
		cardClient = module.get(CardClientAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupSession = () => {
		const token = 'token';
		const session = createMock<BoardImportUserSession>();
		session.call.mockImplementation((request) => request(token));

		return { token, session };
	};

	const newId = (): string => new ObjectId().toHexString();

	const buildColumn = (title: string, cardIds: string[] = []): ColumnResponse => {
		const cards = cardIds.map((cardId) => {
			return { cardId, height: 0 };
		});
		const column = createMock<ColumnResponse>({ id: newId(), title, cards });

		return column;
	};

	const buildCard = (title: string | undefined, elementIds: string[], id = newId()): CardResponse => {
		const elements = elementIds.map((elementId) => createMock<CardResponse['elements'][number]>({ id: elementId }));
		const card = createMock<CardResponse>({ id, title, elements });

		return card;
	};

	const textParams = (html: string) => {
		return { data: { type: 'richText', content: { text: html, inputFormat: 'richTextCk5' } } };
	};

	const plan: BoardPlan = {
		title: 'Board',
		columns: [
			{
				title: 'First',
				cards: [
					{
						title: 'Card 1',
						elements: [
							{ type: PlannedElementType.TEXT, html: '<p>Text 1</p>' },
							{ type: PlannedElementType.TEXT, html: '<p>Text 2</p>' },
						],
					},
					{ title: 'Card 2', elements: [] },
				],
			},
			{
				title: 'Second',
				cards: [{ title: 'Card 3', elements: [{ type: PlannedElementType.TEXT, html: '<p>Text 3</p>' }] }],
			},
		],
	};

	describe('export', () => {
		describe('when the job has no board', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const boardId = newId();
				const target = { type: BoardImportTargetType.COURSE, id: newId() };
				const job = boardImportJobFactory.build({ target });
				const boardParams = { title: plan.title, parentId: target.id, parentType: target.type, layout: 'columns' };
				const firstColumn = buildColumn('');
				const secondColumn = buildColumn('');
				const card1 = buildCard(undefined, [newId(), newId()]);
				const card2 = buildCard(undefined, []);
				const card3 = buildCard(undefined, [newId()]);

				boardsClient.createBoard.mockResolvedValueOnce({ id: boardId });
				boardsClient.createBoardColumn.mockResolvedValueOnce(firstColumn).mockResolvedValueOnce(secondColumn);
				columnClient.createCard.mockResolvedValueOnce(card1).mockResolvedValueOnce(card2).mockResolvedValueOnce(card3);

				return { token, session, job, boardId, boardParams, firstColumn, secondColumn, card1, card2, card3 };
			};

			it('should create the board with the title of the plan in the target of the job', async () => {
				const { token, session, job, boardParams } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.createBoard).toHaveBeenCalledWith(token, boardParams);
			});

			it('should store the board in the job', async () => {
				const { session, job, boardId } = setup();

				await service.export(job, session, plan);

				expect(repo.setBoardId).toHaveBeenCalledWith(job.id, boardId);
			});

			it('should create one column for each column of the plan and set its title', async () => {
				const { token, session, job, boardId, firstColumn, secondColumn } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.createBoardColumn).toHaveBeenCalledTimes(2);
				expect(boardsClient.createBoardColumn).toHaveBeenCalledWith(token, boardId);
				expect(columnClient.updateBoardColumnTitle.mock.calls).toEqual([
					[token, firstColumn.id, { title: 'First' }],
					[token, secondColumn.id, { title: 'Second' }],
				]);
			});

			it('should create the cards in the order of the plan, each with its empty elements', async () => {
				const { token, session, job, firstColumn, secondColumn } = setup();

				await service.export(job, session, plan);

				expect(columnClient.createCard.mock.calls).toEqual([
					[token, firstColumn.id, { requiredEmptyElements: ['richText', 'richText'] }],
					[token, firstColumn.id, { requiredEmptyElements: [] }],
					[token, secondColumn.id, { requiredEmptyElements: ['richText'] }],
				]);
			});

			it('should set the titles of the cards', async () => {
				const { token, session, job, card1, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(cardClient.updateCardTitle.mock.calls).toEqual([
					[token, card1.id, { title: 'Card 1' }],
					[token, card2.id, { title: 'Card 2' }],
					[token, card3.id, { title: 'Card 3' }],
				]);
			});

			it('should write the texts into the elements of the cards', async () => {
				const { token, session, job, card1, card3 } = setup();

				await service.export(job, session, plan);

				expect(cardClient.updateCardElement.mock.calls).toEqual([
					[token, card1.elements[0].id, textParams('<p>Text 1</p>')],
					[token, card1.elements[1].id, textParams('<p>Text 2</p>')],
					[token, card3.elements[0].id, textParams('<p>Text 3</p>')],
				]);
				expect(cardClient.createCardElement).not.toHaveBeenCalled();
			});

			it('should not read the board or its cards', async () => {
				const { session, job } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.getBoardSkeletonById).not.toHaveBeenCalled();
				expect(cardClient.getAllBoardCardsByIds).not.toHaveBeenCalled();
			});
		});

		describe('when a column and a card of the plan have no title', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const planWithoutTitles: BoardPlan = {
					title: 'Board',
					columns: [
						{ title: '', cards: [{ title: '', elements: [{ type: PlannedElementType.TEXT, html: '<p>Text</p>' }] }] },
					],
				};

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockResolvedValueOnce(buildColumn(''));
				columnClient.createCard.mockResolvedValueOnce(buildCard(undefined, [newId()]));

				return { session, job, planWithoutTitles };
			};

			it('should set no title', async () => {
				const { session, job, planWithoutTitles } = setup();

				await service.export(job, session, planWithoutTitles);

				expect(columnClient.updateBoardColumnTitle).not.toHaveBeenCalled();
				expect(cardClient.updateCardTitle).not.toHaveBeenCalled();
			});
		});

		describe('when the plan has no columns', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const emptyPlan: BoardPlan = { title: 'Board', columns: [] };

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });

				return { session, job, emptyPlan };
			};

			it('should create only the board', async () => {
				const { session, job, emptyPlan } = setup();

				await service.export(job, session, emptyPlan);

				expect(boardsClient.createBoard).toHaveBeenCalledTimes(1);
				expect(boardsClient.createBoardColumn).not.toHaveBeenCalled();
			});
		});

		describe('when the job has a part of the board from an attempt before', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const boardId = newId();
				const job = boardImportJobFactory.build({ boardId });
				const card1 = buildCard('Card 1', [newId()]);
				const firstColumn = buildColumn('First', [card1.id]);
				const newElementId = newId();
				const card2 = buildCard(undefined, []);
				const secondColumn = buildColumn('');
				const card3 = buildCard(undefined, [newId()]);

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>({ columns: [firstColumn] }));
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(createMock<CardListResponse>({ data: [card1] }));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: newElementId })
				);
				boardsClient.createBoardColumn.mockResolvedValueOnce(secondColumn);
				columnClient.createCard.mockResolvedValueOnce(card2).mockResolvedValueOnce(card3);

				return { token, session, job, boardId, firstColumn, secondColumn, card1, card2, card3, newElementId };
			};

			it('should read the board of the job and create no other board', async () => {
				const { token, session, job, boardId } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.getBoardSkeletonById).toHaveBeenCalledWith(token, boardId);
				expect(boardsClient.createBoard).not.toHaveBeenCalled();
				expect(repo.setBoardId).not.toHaveBeenCalled();
			});

			it('should create only the columns and cards that the board does not have', async () => {
				const { token, session, job, boardId, firstColumn, secondColumn } = setup();

				await service.export(job, session, plan);

				expect(cardClient.getAllBoardCardsByIds).toHaveBeenCalledTimes(1);
				expect(cardClient.getAllBoardCardsByIds).toHaveBeenCalledWith(
					token,
					firstColumn.cards.map((card) => card.cardId)
				);
				expect(boardsClient.createBoardColumn.mock.calls).toEqual([[token, boardId]]);
				expect(columnClient.createCard.mock.calls).toEqual([
					[token, firstColumn.id, { requiredEmptyElements: [] }],
					[token, secondColumn.id, { requiredEmptyElements: ['richText'] }],
				]);
			});

			it('should set only the titles that are different from the plan', async () => {
				const { token, session, job, secondColumn, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(columnClient.updateBoardColumnTitle.mock.calls).toEqual([[token, secondColumn.id, { title: 'Second' }]]);
				expect(cardClient.updateCardTitle.mock.calls).toEqual([
					[token, card2.id, { title: 'Card 2' }],
					[token, card3.id, { title: 'Card 3' }],
				]);
			});

			it('should create the element that a card does not have and write all texts', async () => {
				const { token, session, job, card1, card3, newElementId } = setup();

				await service.export(job, session, plan);

				expect(cardClient.createCardElement.mock.calls).toEqual([[token, card1.id, { type: 'richText' }]]);
				expect(cardClient.updateCardElement.mock.calls).toEqual([
					[token, card1.elements[0].id, textParams('<p>Text 1</p>')],
					[token, newElementId, textParams('<p>Text 2</p>')],
					[token, card3.elements[0].id, textParams('<p>Text 3</p>')],
				]);
			});
		});

		describe('when a card of the board cannot be read', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const job = boardImportJobFactory.build({ boardId: newId() });
				const column = buildColumn('Column', [newId()]);
				const card = buildCard(undefined, []);
				const planWithOneCard: BoardPlan = {
					title: 'Board',
					columns: [{ title: 'Column', cards: [{ title: 'Card', elements: [] }] }],
				};

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>({ columns: [column] }));
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(createMock<CardListResponse>({ data: [] }));
				columnClient.createCard.mockResolvedValueOnce(card);

				return { token, session, job, column, card, planWithOneCard };
			};

			it('should create a new card', async () => {
				const { token, session, job, column, card, planWithOneCard } = setup();

				await service.export(job, session, planWithOneCard);

				expect(columnClient.createCard).toHaveBeenCalledWith(token, column.id, { requiredEmptyElements: [] });
				expect(cardClient.updateCardTitle).toHaveBeenCalledWith(token, card.id, { title: 'Card' });
			});
		});

		describe('when the board of the job does not exist anymore', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build({ boardId: newId() });
				const boardId = newId();
				const emptyPlan: BoardPlan = { title: 'Board', columns: [] };
				const error = axiosErrorFactory.build({
					response: axiosResponseFactory.build({ status: HttpStatus.NOT_FOUND }),
				});

				boardsClient.getBoardSkeletonById.mockRejectedValueOnce(error);
				boardsClient.createBoard.mockResolvedValueOnce({ id: boardId });

				return { session, job, boardId, emptyPlan };
			};

			it('should remove the board from the job and create a new board', async () => {
				const { session, job, boardId, emptyPlan } = setup();

				await service.export(job, session, emptyPlan);

				expect(repo.removeBoardId).toHaveBeenCalledWith(job.id);
				expect(repo.setBoardId).toHaveBeenCalledWith(job.id, boardId);
				expect(repo.removeBoardId.mock.invocationCallOrder[0]).toBeLessThan(
					boardsClient.createBoard.mock.invocationCallOrder[0]
				);
			});
		});

		describe('when the board of the job cannot be read for another reason', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build({ boardId: newId() });
				const error = axiosErrorFactory.build({
					response: axiosResponseFactory.build({ status: HttpStatus.SERVICE_UNAVAILABLE }),
				});

				boardsClient.getBoardSkeletonById.mockRejectedValueOnce(error);

				return { session, job, error };
			};

			it('should pass the error and keep the board of the job', async () => {
				const { session, job, error } = setup();

				await expect(service.export(job, session, plan)).rejects.toBe(error);

				expect(repo.removeBoardId).not.toHaveBeenCalled();
				expect(boardsClient.createBoard).not.toHaveBeenCalled();
			});
		});

		describe('when a request fails', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const error = new Error('request failed');

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockRejectedValueOnce(error);

				return { session, job, error };
			};

			it('should pass the error and create no cards', async () => {
				const { session, job, error } = setup();

				await expect(service.export(job, session, plan)).rejects.toBe(error);

				expect(columnClient.createCard).not.toHaveBeenCalled();
			});
		});
	});
});
