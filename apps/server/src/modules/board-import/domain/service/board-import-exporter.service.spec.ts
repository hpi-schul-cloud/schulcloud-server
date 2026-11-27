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
	ContentElementType,
} from '@infra/common-cartridge-clients';
import { HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { InputFormat } from '@shared/domain/types';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { boardImportJobFactory } from '../../testing';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportTargetType, type BoardPlan, type PlannedCard, PlannedElementType } from '../type';
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

	const buildCard = (
		title: string | undefined,
		elementIds: string[],
		id = newId(),
		type: ContentElementType = ContentElementType.RICH_TEXT
	): CardResponse => {
		const elements = elementIds.map((elementId) =>
			createMock<CardResponse['elements'][number]>({ id: elementId, type })
		);
		const card = createMock<CardResponse>({ id, title, elements });

		return card;
	};

	const textParams = (html: string) => {
		return {
			data: { type: ContentElementType.RICH_TEXT, content: { text: html, inputFormat: InputFormat.RICH_TEXT_CK5 } },
		};
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

	const [firstPlannedColumn, secondPlannedColumn] = plan.columns;
	const [plannedCard1, plannedCard2] = firstPlannedColumn.cards;
	const [plannedCard3] = secondPlannedColumn.cards;
	const [plannedText1, plannedText2] = plannedCard1.elements;
	const [plannedText3] = plannedCard3.elements;

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
					[token, firstColumn.id, { title: firstPlannedColumn.title }],
					[token, secondColumn.id, { title: secondPlannedColumn.title }],
				]);
			});

			it('should create the cards in the order of the plan, each with its empty elements', async () => {
				const { token, session, job, firstColumn, secondColumn } = setup();

				await service.export(job, session, plan);

				expect(columnClient.createCard.mock.calls).toEqual([
					[
						token,
						firstColumn.id,
						{ requiredEmptyElements: [ContentElementType.RICH_TEXT, ContentElementType.RICH_TEXT] },
					],
					[token, firstColumn.id, { requiredEmptyElements: [] }],
					[token, secondColumn.id, { requiredEmptyElements: [ContentElementType.RICH_TEXT] }],
				]);
			});

			it('should set the titles of the cards', async () => {
				const { token, session, job, card1, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(cardClient.updateCardTitle.mock.calls).toEqual([
					[token, card1.id, { title: plannedCard1.title }],
					[token, card2.id, { title: plannedCard2.title }],
					[token, card3.id, { title: plannedCard3.title }],
				]);
			});

			it('should write the texts into the elements of the cards', async () => {
				const { token, session, job, card1, card3 } = setup();

				await service.export(job, session, plan);

				expect(cardClient.updateCardElement.mock.calls).toEqual([
					[token, card1.elements[0].id, textParams(plannedText1.html)],
					[token, card1.elements[1].id, textParams(plannedText2.html)],
					[token, card3.elements[0].id, textParams(plannedText3.html)],
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
				const card1 = buildCard(plannedCard1.title, [newId()]);
				const firstColumn = buildColumn(firstPlannedColumn.title, [card1.id]);
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
					[token, secondColumn.id, { requiredEmptyElements: [ContentElementType.RICH_TEXT] }],
				]);
			});

			it('should set only the titles that are different from the plan', async () => {
				const { token, session, job, secondColumn, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(columnClient.updateBoardColumnTitle.mock.calls).toEqual([
					[token, secondColumn.id, { title: secondPlannedColumn.title }],
				]);
				expect(cardClient.updateCardTitle.mock.calls).toEqual([
					[token, card2.id, { title: plannedCard2.title }],
					[token, card3.id, { title: plannedCard3.title }],
				]);
			});

			it('should create the element that a card does not have and write all texts', async () => {
				const { token, session, job, card1, card3, newElementId } = setup();

				await service.export(job, session, plan);

				expect(cardClient.createCardElement.mock.calls).toEqual([
					[token, card1.id, { type: ContentElementType.RICH_TEXT }],
				]);
				expect(cardClient.updateCardElement.mock.calls).toEqual([
					[token, card1.elements[0].id, textParams(plannedText1.html)],
					[token, newElementId, textParams(plannedText2.html)],
					[token, card3.elements[0].id, textParams(plannedText3.html)],
				]);
			});
		});

		describe('when a card of the board cannot be read', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const job = boardImportJobFactory.build({ boardId: newId() });
				const plannedCard: PlannedCard = { title: 'Card', elements: [] };
				const planWithOneCard: BoardPlan = {
					title: 'Board',
					columns: [{ title: 'Column', cards: [plannedCard] }],
				};
				const column = buildColumn(planWithOneCard.columns[0].title, [newId()]);
				const card = buildCard(undefined, []);
				const position = 0;

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>({ columns: [column] }));
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(createMock<CardListResponse>({ data: [] }));
				columnClient.createCard.mockResolvedValueOnce(card);

				return { token, session, job, column, card, plannedCard, planWithOneCard, position };
			};

			it('should create a new card at the position of the card', async () => {
				const { token, session, job, column, card, plannedCard, planWithOneCard, position } = setup();

				await service.export(job, session, planWithOneCard);

				expect(columnClient.createCard).toHaveBeenCalledWith(token, column.id, { requiredEmptyElements: [], position });
				expect(cardClient.updateCardTitle).toHaveBeenCalledWith(token, card.id, { title: plannedCard.title });
			});
		});

		describe('when an element of a card of the board is not a text element', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const job = boardImportJobFactory.build({ boardId: newId() });
				const plannedCard: PlannedCard = {
					title: 'Card',
					elements: [{ type: PlannedElementType.TEXT, html: '<p>Text</p>' }],
				};
				const planWithOneCard: BoardPlan = {
					title: 'Board',
					columns: [{ title: 'Column', cards: [plannedCard] }],
				};
				const card = buildCard(plannedCard.title, [newId()], newId(), ContentElementType.LINK);
				const column = buildColumn(planWithOneCard.columns[0].title, [card.id]);
				const newElementId = newId();
				const toPosition = 0;

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>({ columns: [column] }));
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(createMock<CardListResponse>({ data: [card] }));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: newElementId })
				);

				return { token, session, job, card, plannedCard, planWithOneCard, newElementId, toPosition };
			};

			it('should create a text element before the other element and write the text into it', async () => {
				const { token, session, job, card, plannedCard, planWithOneCard, newElementId, toPosition } = setup();

				await service.export(job, session, planWithOneCard);

				expect(cardClient.createCardElement).toHaveBeenCalledWith(token, card.id, {
					type: ContentElementType.RICH_TEXT,
					toPosition,
				});
				expect(cardClient.updateCardElement.mock.calls).toEqual([
					[token, newElementId, textParams(plannedCard.elements[0].html)],
				]);
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
