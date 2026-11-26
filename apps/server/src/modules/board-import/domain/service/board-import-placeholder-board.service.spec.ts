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
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { boardImportJobFactory } from '../../testing';
import { BOARD_IMPORT_JOB_REPO, type BoardImportJobRepo } from '../interface';
import { BoardImportSourceType, BoardImportTargetType } from '../type';
import { BoardImportPlaceholderBoardService } from './board-import-placeholder-board.service';
import { type BoardImportUserSession } from './board-import-user-session';

describe(BoardImportPlaceholderBoardService.name, () => {
	let module: TestingModule;
	let service: BoardImportPlaceholderBoardService;
	let repo: DeepMocked<BoardImportJobRepo>;
	let boardsClient: DeepMocked<BoardsClientAdapter>;
	let columnClient: DeepMocked<ColumnClientAdapter>;
	let cardClient: DeepMocked<CardClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportPlaceholderBoardService,
				{ provide: BOARD_IMPORT_JOB_REPO, useValue: createMock<BoardImportJobRepo>() },
				{ provide: BoardsClientAdapter, useValue: createMock<BoardsClientAdapter>() },
				{ provide: ColumnClientAdapter, useValue: createMock<ColumnClientAdapter>() },
				{ provide: CardClientAdapter, useValue: createMock<CardClientAdapter>() },
			],
		}).compile();

		service = module.get(BoardImportPlaceholderBoardService);
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

	const setupIds = () => {
		const boardId = new ObjectId().toHexString();
		const columnId = new ObjectId().toHexString();
		const cardId = new ObjectId().toHexString();
		const elementId = new ObjectId().toHexString();

		return { boardId, columnId, cardId, elementId };
	};

	describe('write', () => {
		describe('when the job has no board', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const { boardId, columnId, cardId, elementId } = setupIds();
				const target = { type: BoardImportTargetType.COURSE, id: new ObjectId().toHexString() };
				const job = boardImportJobFactory.build({
					source: { type: BoardImportSourceType.TASKCARDS, link: 'https://example.com/board?a=1&b=<2>' },
					target,
				});
				const boardParams = { title: 'Import', parentId: target.id, parentType: target.type, layout: 'columns' };
				const text = '<p>https://example.com/board?a=1&amp;b=&lt;2&gt;</p>';
				const cardParams = {};
				const createElementParams = { type: 'richText' };
				const elementParams = { data: { type: 'richText', content: { text, inputFormat: 'richTextCk5' } } };

				boardsClient.createBoard.mockResolvedValueOnce({ id: boardId });
				boardsClient.createBoardColumn.mockResolvedValueOnce(createMock<ColumnResponse>({ id: columnId, cards: [] }));
				columnClient.createCard.mockResolvedValueOnce(createMock<CardResponse>({ id: cardId, elements: [] }));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: elementId })
				);

				return {
					job,
					session,
					token,
					boardId,
					columnId,
					cardId,
					elementId,
					boardParams,
					cardParams,
					createElementParams,
					elementParams,
				};
			};

			it('should create the board in the target as the user', async () => {
				const { job, session, token, boardParams } = setup();

				await service.write(job, session);

				expect(boardsClient.createBoard).toHaveBeenCalledWith(token, boardParams);
			});

			it('should store the board in the job', async () => {
				const { job, session, boardId } = setup();

				await service.write(job, session);

				expect(repo.setBoardId).toHaveBeenCalledWith(job.id, boardId);
			});

			it('should create a column, a card and a text element as the user', async () => {
				const { job, session, token, boardId, columnId, cardId, cardParams, createElementParams } = setup();

				await service.write(job, session);

				expect(boardsClient.createBoardColumn).toHaveBeenCalledWith(token, boardId);
				expect(columnClient.createCard).toHaveBeenCalledWith(token, columnId, cardParams);
				expect(cardClient.createCardElement).toHaveBeenCalledWith(token, cardId, createElementParams);
			});

			it('should write the link of the job as text into the element', async () => {
				const { job, session, token, elementId, elementParams } = setup();

				await service.write(job, session);

				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, elementId, elementParams);
			});

			it('should not read the new board', async () => {
				const { job, session } = setup();

				await service.write(job, session);

				expect(boardsClient.getBoardSkeletonById).not.toHaveBeenCalled();
				expect(cardClient.getAllBoardCardsByIds).not.toHaveBeenCalled();
			});
		});

		describe('when the job has an empty board from an attempt before', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const { boardId, columnId, cardId, elementId } = setupIds();
				const job = boardImportJobFactory.build({ boardId });

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(createMock<BoardResponse>({ columns: [] }));
				boardsClient.createBoardColumn.mockResolvedValueOnce(createMock<ColumnResponse>({ id: columnId, cards: [] }));
				columnClient.createCard.mockResolvedValueOnce(createMock<CardResponse>({ id: cardId, elements: [] }));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: elementId })
				);

				return { job, session, token, boardId, elementId };
			};

			it('should create no second board and add the missing parts', async () => {
				const { job, session, token, boardId, elementId } = setup();

				await service.write(job, session);

				expect(boardsClient.createBoard).not.toHaveBeenCalled();
				expect(boardsClient.createBoardColumn).toHaveBeenCalledWith(token, boardId);
				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, elementId, expect.anything());
			});
		});

		describe('when the job has a complete board from an attempt before', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const { boardId, columnId, cardId, elementId } = setupIds();
				const job = boardImportJobFactory.build({ boardId });

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(
					createMock<BoardResponse>({ columns: [{ id: columnId, cards: [{ cardId }] }] })
				);
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(
					createMock<CardListResponse>({
						data: [{ elements: [{ id: elementId, type: ContentElementType.RICH_TEXT }] }],
					})
				);

				return { job, session, token, boardId, cardId, elementId };
			};

			it('should read the board of the job', async () => {
				const { job, session, token, boardId, cardId } = setup();

				await service.write(job, session);

				expect(boardsClient.getBoardSkeletonById).toHaveBeenCalledWith(token, boardId);
				expect(cardClient.getAllBoardCardsByIds).toHaveBeenCalledWith(token, [cardId]);
			});

			it('should create no second board and no second part', async () => {
				const { job, session } = setup();

				await service.write(job, session);

				expect(boardsClient.createBoard).not.toHaveBeenCalled();
				expect(repo.setBoardId).not.toHaveBeenCalled();
				expect(boardsClient.createBoardColumn).not.toHaveBeenCalled();
				expect(columnClient.createCard).not.toHaveBeenCalled();
				expect(cardClient.createCardElement).not.toHaveBeenCalled();
			});

			it('should write the text into the existing element', async () => {
				const { job, session, token, elementId } = setup();

				await service.write(job, session);

				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, elementId, expect.anything());
			});
		});

		describe('when the card of the board cannot be read', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const { boardId, columnId, cardId, elementId } = setupIds();
				const newCardId = new ObjectId().toHexString();
				const job = boardImportJobFactory.build({ boardId });

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(
					createMock<BoardResponse>({ columns: [{ id: columnId, cards: [{ cardId }] }] })
				);
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(createMock<CardListResponse>({ data: [] }));
				columnClient.createCard.mockResolvedValueOnce(createMock<CardResponse>({ id: newCardId, elements: [] }));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: elementId })
				);

				return { job, session, token, columnId, newCardId, elementId };
			};

			it('should create a new card and write the text into its element', async () => {
				const { job, session, token, columnId, newCardId, elementId } = setup();

				await service.write(job, session);

				expect(columnClient.createCard).toHaveBeenCalledWith(token, columnId, {});
				expect(cardClient.createCardElement).toHaveBeenCalledWith(token, newCardId, expect.anything());
				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, elementId, expect.anything());
			});
		});

		describe('when the card of the board has no text element', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const { boardId, columnId, cardId, elementId } = setupIds();
				const otherElementId = new ObjectId().toHexString();
				const job = boardImportJobFactory.build({ boardId });

				boardsClient.getBoardSkeletonById.mockResolvedValueOnce(
					createMock<BoardResponse>({ columns: [{ id: columnId, cards: [{ cardId }] }] })
				);
				cardClient.getAllBoardCardsByIds.mockResolvedValueOnce(
					createMock<CardListResponse>({
						data: [{ id: cardId, elements: [{ id: otherElementId, type: ContentElementType.FILE }] }],
					})
				);
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: elementId })
				);

				return { job, session, token, cardId, elementId, otherElementId };
			};

			it('should create a text element and write the text into it', async () => {
				const { job, session, token, cardId, elementId, otherElementId } = setup();

				await service.write(job, session);

				expect(cardClient.createCardElement).toHaveBeenCalledWith(token, cardId, expect.anything());
				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, elementId, expect.anything());
				expect(cardClient.updateCardElement).not.toHaveBeenCalledWith(token, otherElementId, expect.anything());
			});
		});

		describe('when the board of the job does not exist anymore', () => {
			const setup = () => {
				const { token, session } = setupSession();
				const { boardId, columnId, cardId, elementId } = setupIds();
				const newBoardId = new ObjectId().toHexString();
				const job = boardImportJobFactory.build({ boardId });
				const notFoundError = axiosErrorFactory.build({
					response: axiosResponseFactory.build({ status: HttpStatus.NOT_FOUND }),
				});

				boardsClient.getBoardSkeletonById.mockRejectedValueOnce(notFoundError);
				boardsClient.createBoard.mockResolvedValueOnce({ id: newBoardId });
				boardsClient.createBoardColumn.mockResolvedValueOnce(createMock<ColumnResponse>({ id: columnId, cards: [] }));
				columnClient.createCard.mockResolvedValueOnce(createMock<CardResponse>({ id: cardId, elements: [] }));
				cardClient.createCardElement.mockResolvedValueOnce(
					createMock<CardControllerCreateElement201Response>({ id: elementId })
				);

				return { job, session, token, newBoardId, elementId };
			};

			it('should remove the board from the job', async () => {
				const { job, session } = setup();

				await service.write(job, session);

				expect(repo.removeBoardId).toHaveBeenCalledWith(job.id);
			});

			it('should create and store a new board', async () => {
				const { job, session, token, newBoardId } = setup();

				await service.write(job, session);

				expect(boardsClient.createBoard).toHaveBeenCalledWith(token, expect.anything());
				expect(repo.setBoardId).toHaveBeenCalledWith(job.id, newBoardId);
				expect(boardsClient.createBoardColumn).toHaveBeenCalledWith(token, newBoardId);
			});

			it('should write the text into the new element', async () => {
				const { job, session, token, elementId } = setup();

				await service.write(job, session);

				expect(cardClient.updateCardElement).toHaveBeenCalledWith(token, elementId, expect.anything());
			});
		});

		describe('when the board of the job cannot be read for another reason', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build({ boardId: new ObjectId().toHexString() });
				const error = axiosErrorFactory.build({
					response: axiosResponseFactory.build({ status: HttpStatus.INTERNAL_SERVER_ERROR }),
				});

				boardsClient.getBoardSkeletonById.mockRejectedValueOnce(error);

				return { job, session, error };
			};

			it('should pass the error and keep the board in the job', async () => {
				const { job, session, error } = setup();

				await expect(service.write(job, session)).rejects.toBe(error);

				expect(repo.removeBoardId).not.toHaveBeenCalled();
				expect(boardsClient.createBoard).not.toHaveBeenCalled();
			});
		});

		describe('when a request fails', () => {
			const setup = () => {
				const { session } = setupSession();
				const job = boardImportJobFactory.build();
				const error = new Error('request failed');

				boardsClient.createBoard.mockRejectedValueOnce(error);

				return { job, session, error };
			};

			it('should pass the error and store no board', async () => {
				const { job, session, error } = setup();

				await expect(service.write(job, session)).rejects.toBe(error);

				expect(repo.setBoardId).not.toHaveBeenCalled();
			});
		});
	});
});
