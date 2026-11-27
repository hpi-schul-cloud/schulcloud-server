import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	type BoardResponse,
	BoardsClientAdapter,
	CardClientAdapter,
	type CardControllerCreateElement201Response,
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
import { boardImportJobFactory, boardPlanFactory } from '../../testing';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportTargetType, PlannedElementType } from '../type';
import { BoardImportExporterService } from './board-import-exporter.service';
import { BoardImportLinkPreviewService } from './board-import-link-preview.service';
import { type BoardImportUserSession } from './board-import-user-session';

describe(BoardImportExporterService.name, () => {
	let module: TestingModule;
	let service: BoardImportExporterService;
	let repo: DeepMocked<BoardImportJobRepo>;
	let boardsClient: DeepMocked<BoardsClientAdapter>;
	let columnClient: DeepMocked<ColumnClientAdapter>;
	let cardClient: DeepMocked<CardClientAdapter>;
	let linkPreviewService: DeepMocked<BoardImportLinkPreviewService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportExporterService,
				{ provide: BOARD_IMPORT_JOB_REPO, useValue: createMock<BoardImportJobRepo>() },
				{ provide: BoardsClientAdapter, useValue: createMock<BoardsClientAdapter>() },
				{ provide: ColumnClientAdapter, useValue: createMock<ColumnClientAdapter>() },
				{ provide: CardClientAdapter, useValue: createMock<CardClientAdapter>() },
				{ provide: BoardImportLinkPreviewService, useValue: createMock<BoardImportLinkPreviewService>() },
			],
		}).compile();

		service = module.get(BoardImportExporterService);
		repo = module.get(BOARD_IMPORT_JOB_REPO);
		boardsClient = module.get(BoardsClientAdapter);
		columnClient = module.get(ColumnClientAdapter);
		cardClient = module.get(CardClientAdapter);
		linkPreviewService = module.get(BoardImportLinkPreviewService);
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

	const buildColumn = (): ColumnResponse => {
		const column = createMock<ColumnResponse>({ id: newId() });

		return column;
	};

	const buildCard = (title: string | undefined, elementIds: string[]): CardResponse => {
		const elements = elementIds.map((elementId) =>
			createMock<CardResponse['elements'][number]>({ id: elementId, type: ContentElementType.RICH_TEXT })
		);
		const card = createMock<CardResponse>({ id: newId(), title, elements });

		return card;
	};

	const textParams = (html: string) => {
		return {
			data: { type: ContentElementType.RICH_TEXT, content: { text: html, inputFormat: InputFormat.RICH_TEXT_CK5 } },
		};
	};

	const text1 = '<p>Text 1</p>';
	const text2 = '<p>Text 2</p>';
	const text3 = '<p>Text 3</p>';
	const plan = boardPlanFactory.build({
		columns: [
			{
				title: 'First',
				cards: [
					{
						title: 'Card 1',
						elements: [
							{ type: PlannedElementType.TEXT, html: text1 },
							{ type: PlannedElementType.TEXT, html: text2 },
						],
					},
					{ title: 'Card 2', elements: [] },
				],
			},
			{
				title: 'Second',
				cards: [{ title: 'Card 3', elements: [{ type: PlannedElementType.TEXT, html: text3 }] }],
			},
		],
	});

	const [firstPlannedColumn, secondPlannedColumn] = plan.columns;
	const [plannedCard1, plannedCard2] = firstPlannedColumn.cards;
	const [plannedCard3] = secondPlannedColumn.cards;

	describe('export', () => {
		describe('when the job has no board', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const boardId = newId();
				const target = { type: BoardImportTargetType.COURSE, id: newId() };
				const job = boardImportJobFactory.build({ target });
				const boardParams = { title: plan.title, parentId: target.id, parentType: target.type, layout: 'columns' };
				const firstColumn = buildColumn();
				const secondColumn = buildColumn();
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

				expect(repo.setBoardId).toHaveBeenCalledWith(job.id, job.attempts, boardId);
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
					[token, card1.elements[0].id, textParams(text1)],
					[token, card1.elements[1].id, textParams(text2)],
					[token, card3.elements[0].id, textParams(text3)],
				]);
				expect(cardClient.createCardElement).not.toHaveBeenCalled();
			});

			it('should not read the board', async () => {
				const { session, job } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.getBoardSkeletonById).not.toHaveBeenCalled();
			});

			it('should store a checkpoint for each column and card, in the order of the plan', async () => {
				const { session, job, firstColumn, secondColumn, card1, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(repo.addColumnCheckpoint.mock.calls).toEqual([
					[job.id, job.attempts, firstColumn.id],
					[job.id, job.attempts, secondColumn.id],
				]);
				expect(repo.addCardCheckpoint.mock.calls).toEqual([
					[job.id, job.attempts, 0, card1.id],
					[job.id, job.attempts, 0, card2.id],
					[job.id, job.attempts, 1, card3.id],
				]);
			});

			it('should store the checkpoint of a card after the texts of the card are written', async () => {
				const { session, job } = setup();

				await service.export(job, session, plan);

				expect(cardClient.updateCardElement.mock.invocationCallOrder[1]).toBeLessThan(
					repo.addCardCheckpoint.mock.invocationCallOrder[0]
				);
			});
		});

		describe('when a column and a card of the plan have no title', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const planWithoutTitles = boardPlanFactory.build({
					columns: [
						{ title: '', cards: [{ title: '', elements: [{ type: PlannedElementType.TEXT, html: '<p>Text</p>' }] }] },
					],
				});

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockResolvedValueOnce(buildColumn());
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

		describe('when the response for a new card has not all elements', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const job = boardImportJobFactory.build();
				const card = buildCard(undefined, [newId()]);
				const newElementId = newId();

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockResolvedValueOnce(buildColumn()).mockResolvedValueOnce(buildColumn());
				columnClient.createCard
					.mockResolvedValueOnce(card)
					.mockResolvedValueOnce(buildCard(undefined, []))
					.mockResolvedValueOnce(buildCard(undefined, [newId()]));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: newElementId })
				);

				return { token, session, job, card, newElementId };
			};

			it('should create the element that the card does not have and write the text into it', async () => {
				const { token, session, job, card, newElementId } = setup();

				await service.export(job, session, plan);

				expect(cardClient.createCardElement.mock.calls).toEqual([
					[token, card.id, { type: ContentElementType.RICH_TEXT }],
				]);
				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, newElementId, textParams(text2));
			});
		});

		describe('when a card of the plan has links', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const job = boardImportJobFactory.build();
				const linkUrl = 'https://example.com/page';
				const planWithLink = boardPlanFactory.build({
					columns: [
						{
							title: 'Column',
							cards: [
								{
									title: 'Card',
									elements: [
										{ type: PlannedElementType.TEXT, html: text1 },
										{ type: PlannedElementType.LINK, url: linkUrl },
									],
								},
							],
						},
					],
				});
				const column = buildColumn();
				const card = buildCard(undefined, [newId(), newId()]);
				const [textElement, linkElement] = card.elements;
				const content = { url: linkUrl, title: 'Page', description: 'Description', imageUrl: '', originalImageUrl: '' };
				const linkParams = { data: { type: ContentElementType.LINK, content } };

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockResolvedValueOnce(column);
				columnClient.createCard.mockResolvedValueOnce(card);
				linkPreviewService.buildLinkContent.mockResolvedValueOnce(content);

				return { token, session, job, linkUrl, planWithLink, column, card, textElement, linkElement, linkParams };
			};

			it('should create the card with an empty element of the type of each planned element', async () => {
				const { token, session, job, planWithLink, column } = setup();

				await service.export(job, session, planWithLink);

				expect(columnClient.createCard).toHaveBeenCalledWith(token, column.id, {
					requiredEmptyElements: [ContentElementType.RICH_TEXT, ContentElementType.LINK],
				});
			});

			it('should build the content of the link for its element', async () => {
				const { session, job, linkUrl, planWithLink, linkElement } = setup();

				await service.export(job, session, planWithLink);

				expect(linkPreviewService.buildLinkContent.mock.calls).toEqual([[linkElement.id, linkUrl, session]]);
			});

			it('should write the text and the link into the elements at their positions', async () => {
				const { token, session, job, planWithLink, textElement, linkElement, linkParams } = setup();

				await service.export(job, session, planWithLink);

				expect(cardClient.updateCardElement.mock.calls).toEqual([
					[token, textElement.id, textParams(text1)],
					[token, linkElement.id, linkParams],
				]);
			});

			it('should store the checkpoint of the card', async () => {
				const { session, job, planWithLink, card } = setup();

				await service.export(job, session, planWithLink);

				expect(repo.addCardCheckpoint).toHaveBeenCalledWith(job.id, job.attempts, 0, card.id);
			});
		});

		describe('when the content of a link cannot be built', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const planWithLink = boardPlanFactory.build({
					columns: [
						{
							title: 'Column',
							cards: [{ title: 'Card', elements: [{ type: PlannedElementType.LINK, url: 'https://example.com' }] }],
						},
					],
				});
				const error = new Error('request failed');

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockResolvedValueOnce(buildColumn());
				columnClient.createCard.mockResolvedValueOnce(buildCard(undefined, [newId()]));
				linkPreviewService.buildLinkContent.mockRejectedValueOnce(error);

				return { session, job, planWithLink, error };
			};

			it('should pass the error and store no checkpoint for the card', async () => {
				const { session, job, planWithLink, error } = setup();

				await expect(service.export(job, session, planWithLink)).rejects.toBe(error);

				expect(repo.addCardCheckpoint).not.toHaveBeenCalled();
			});
		});

		describe('when the plan has no columns', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const emptyPlan = boardPlanFactory.build();

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

		describe('when the job has checkpoints that end in a column', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const boardId = newId();
				const firstColumnId = newId();
				const job = boardImportJobFactory.build({
					boardId,
					checkpoints: [{ columnId: firstColumnId, cardIds: [newId()] }],
				});
				const card2 = buildCard(undefined, []);
				const secondColumn = buildColumn();
				const card3 = buildCard(undefined, [newId()]);

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>());
				boardsClient.createBoardColumn.mockResolvedValueOnce(secondColumn);
				columnClient.createCard.mockResolvedValueOnce(card2).mockResolvedValueOnce(card3);

				return { token, session, job, boardId, firstColumnId, secondColumn, card2, card3 };
			};

			it('should check that the board of the job exists and create no other board', async () => {
				const { token, session, job, boardId } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.getBoardSkeletonById).toHaveBeenCalledWith(token, boardId);
				expect(boardsClient.createBoard).not.toHaveBeenCalled();
				expect(repo.setBoardId).not.toHaveBeenCalled();
				expect(repo.resetBoard).not.toHaveBeenCalled();
			});

			it('should create only the columns and cards that have no checkpoint', async () => {
				const { token, session, job, boardId, firstColumnId, secondColumn } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.createBoardColumn.mock.calls).toEqual([[token, boardId]]);
				expect(columnClient.createCard.mock.calls).toEqual([
					[token, firstColumnId, { requiredEmptyElements: [] }],
					[token, secondColumn.id, { requiredEmptyElements: [ContentElementType.RICH_TEXT] }],
				]);
			});

			it('should change no column and no card that has a checkpoint', async () => {
				const { token, session, job, secondColumn, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(columnClient.updateBoardColumnTitle.mock.calls).toEqual([
					[token, secondColumn.id, { title: secondPlannedColumn.title }],
				]);
				expect(cardClient.updateCardTitle.mock.calls).toEqual([
					[token, card2.id, { title: plannedCard2.title }],
					[token, card3.id, { title: plannedCard3.title }],
				]);
				expect(cardClient.updateCardElement.mock.calls).toEqual([[token, card3.elements[0].id, textParams(text3)]]);
			});

			it('should store a checkpoint for each new column and card', async () => {
				const { session, job, secondColumn, card2, card3 } = setup();

				await service.export(job, session, plan);

				expect(repo.addCardCheckpoint.mock.calls).toEqual([
					[job.id, job.attempts, 0, card2.id],
					[job.id, job.attempts, 1, card3.id],
				]);
				expect(repo.addColumnCheckpoint.mock.calls).toEqual([[job.id, job.attempts, secondColumn.id]]);
			});
		});

		describe('when the job has checkpoints that end after a column', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const boardId = newId();
				const job = boardImportJobFactory.build({
					boardId,
					checkpoints: [{ columnId: newId(), cardIds: [newId(), newId()] }],
				});
				const secondColumn = buildColumn();
				const card3 = buildCard(undefined, [newId()]);

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>());
				boardsClient.createBoardColumn.mockResolvedValueOnce(secondColumn);
				columnClient.createCard.mockResolvedValueOnce(card3);

				return { token, session, job, boardId, secondColumn };
			};

			it('should create only the next column with its cards', async () => {
				const { token, session, job, boardId, secondColumn } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.createBoardColumn.mock.calls).toEqual([[token, boardId]]);
				expect(columnClient.createCard.mock.calls).toEqual([
					[token, secondColumn.id, { requiredEmptyElements: [ContentElementType.RICH_TEXT] }],
				]);
			});
		});

		describe('when the job has a checkpoint for each column and card of the plan', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build({
					boardId: newId(),
					checkpoints: [
						{ columnId: newId(), cardIds: [newId(), newId()] },
						{ columnId: newId(), cardIds: [newId()] },
					],
				});

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>());

				return { session, job };
			};

			it('should create and change nothing', async () => {
				const { session, job } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.createBoard).not.toHaveBeenCalled();
				expect(boardsClient.createBoardColumn).not.toHaveBeenCalled();
				expect(columnClient.createCard).not.toHaveBeenCalled();
				expect(columnClient.updateBoardColumnTitle).not.toHaveBeenCalled();
				expect(cardClient.updateCardTitle).not.toHaveBeenCalled();
				expect(cardClient.updateCardElement).not.toHaveBeenCalled();
				expect(repo.addColumnCheckpoint).not.toHaveBeenCalled();
				expect(repo.addCardCheckpoint).not.toHaveBeenCalled();
			});
		});

		describe('when the board of the job does not exist anymore', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build({
					boardId: newId(),
					checkpoints: [{ columnId: newId(), cardIds: [newId(), newId()] }],
				});
				const boardId = newId();
				const error = axiosErrorFactory.build({
					response: axiosResponseFactory.build({ status: HttpStatus.NOT_FOUND }),
				});

				boardsClient.getBoardSkeletonById.mockRejectedValueOnce(error);
				boardsClient.createBoard.mockResolvedValueOnce({ id: boardId });
				boardsClient.createBoardColumn.mockResolvedValueOnce(buildColumn()).mockResolvedValueOnce(buildColumn());
				columnClient.createCard
					.mockResolvedValueOnce(buildCard(undefined, [newId(), newId()]))
					.mockResolvedValueOnce(buildCard(undefined, []))
					.mockResolvedValueOnce(buildCard(undefined, [newId()]));

				return { session, job, boardId };
			};

			it('should remove the board and its checkpoints from the job and create a new board', async () => {
				const { session, job, boardId } = setup();

				await service.export(job, session, plan);

				expect(repo.resetBoard).toHaveBeenCalledWith(job.id, job.attempts);
				expect(repo.setBoardId).toHaveBeenCalledWith(job.id, job.attempts, boardId);
				expect(repo.resetBoard.mock.invocationCallOrder[0]).toBeLessThan(
					boardsClient.createBoard.mock.invocationCallOrder[0]
				);
			});

			it('should create all columns and cards of the plan in the new board', async () => {
				const { session, job } = setup();

				await service.export(job, session, plan);

				expect(boardsClient.createBoardColumn).toHaveBeenCalledTimes(2);
				expect(columnClient.createCard).toHaveBeenCalledTimes(3);
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

				expect(repo.resetBoard).not.toHaveBeenCalled();
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

			it('should store no checkpoint for the step that failed', async () => {
				const { session, job } = setup();

				await service.export(job, session, plan).catch(() => undefined);

				expect(repo.addColumnCheckpoint).not.toHaveBeenCalled();
			});
		});

		describe('when a request for a card fails after the card is created', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const error = new Error('request failed');

				boardsClient.createBoard.mockResolvedValueOnce({ id: newId() });
				boardsClient.createBoardColumn.mockResolvedValueOnce(buildColumn());
				columnClient.createCard.mockResolvedValueOnce(buildCard(undefined, [newId(), newId()]));
				cardClient.updateCardElement.mockRejectedValueOnce(error);

				return { session, job, error };
			};

			it('should pass the error and store no checkpoint for the card', async () => {
				const { session, job, error } = setup();

				await expect(service.export(job, session, plan)).rejects.toBe(error);

				expect(repo.addColumnCheckpoint).toHaveBeenCalledTimes(1);
				expect(repo.addCardCheckpoint).not.toHaveBeenCalled();
			});
		});
	});
});
