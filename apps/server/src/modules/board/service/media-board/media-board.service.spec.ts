import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, MediaBoard } from '@shared/domain/domainobject';
import { columnBoardFactory, mediaBoardFactory, mediaLineFactory } from '@shared/testing';
import { MediaBoardColors, MediaBoardLayoutType } from '../../domain';
import { InvalidBoardTypeLoggableException } from '../../loggable';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';
import { MediaBoardService } from './media-board.service';

describe(MediaBoardService.name, () => {
	let module: TestingModule;
	let service: MediaBoardService;

	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaBoardService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoService>(),
				},
			],
		}).compile();

		service = module.get(MediaBoardService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when a board with the id exists', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();

				boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

				return {
					board,
				};
			};

			it('should return the board', async () => {
				const { board } = setup();

				const result = await service.findById(board.id);

				expect(result).toEqual(board);
			});
		});
	});

	describe('findIdsByExternalReference', () => {
		describe('when a board for the context exists', () => {
			const setup = () => {
				const boardId = new ObjectId().toHexString();
				const userId = new ObjectId().toHexString();

				boardDoRepo.findIdsByExternalReference.mockResolvedValueOnce([boardId]);

				return {
					boardId,
					userId,
				};
			};

			it('should return the board id', async () => {
				const { boardId, userId } = setup();

				const result = await service.findIdsByExternalReference({ type: BoardExternalReferenceType.User, id: userId });

				expect(result).toEqual([boardId]);
			});
		});
	});

	describe('create', () => {
		describe('when creating a new board', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				return {
					userId,
				};
			};

			it('should return the board', async () => {
				const { userId } = setup();

				const result = await service.create({ type: BoardExternalReferenceType.User, id: userId });

				expect(result).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
						context: {
							type: BoardExternalReferenceType.User,
							id: userId,
						},
						layout: MediaBoardLayoutType.LIST,
						mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
						mediaAvailableLineCollapsed: false,
					})
				);
			});

			it('should save the new board', async () => {
				const { userId } = setup();

				const result = await service.create({ type: BoardExternalReferenceType.User, id: userId });

				expect(boardDoRepo.save).toHaveBeenCalledWith(result);
			});
		});
	});

	describe('updateAvailableLineColor', () => {
		describe('when changing the color of the available line', () => {
			const setup = () => {
				const board = mediaBoardFactory.build({
					mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
				});

				boardDoService.getRootBoardDo.mockResolvedValueOnce(board);

				return {
					board,
				};
			};

			it('should set the color of the line', async () => {
				const { board } = setup();

				await service.updateAvailableLineColor(board, MediaBoardColors.RED);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					new MediaBoard({ ...board.getProps(), mediaAvailableLineBackgroundColor: MediaBoardColors.RED })
				);
			});
		});
	});

	describe('collapseAvailableLine', () => {
		describe('when changing the visibility of the available line', () => {
			const setup = () => {
				const board = mediaBoardFactory.build({
					mediaAvailableLineCollapsed: false,
				});

				boardDoService.getRootBoardDo.mockResolvedValueOnce(board);

				return {
					board,
				};
			};

			it('should set the visibility of the line', async () => {
				const { board } = setup();

				await service.collapseAvailableLine(board, true);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					new MediaBoard({ ...board.getProps(), mediaAvailableLineCollapsed: true })
				);
			});
		});
	});

	describe('setLayout', () => {
		describe('when changing the layout of the board', () => {
			const setup = () => {
				const board = mediaBoardFactory.build({
					layout: MediaBoardLayoutType.LIST,
				});

				boardDoService.getRootBoardDo.mockResolvedValueOnce(board);

				return {
					board,
				};
			};

			it('should set the layout of the board', async () => {
				const { board } = setup();

				await service.setLayout(board, MediaBoardLayoutType.GRID);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					new MediaBoard({ ...board.getProps(), layout: MediaBoardLayoutType.GRID })
				);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting a board', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();

				return {
					board,
				};
			};

			it('should delete the board', async () => {
				const { board } = setup();

				await service.delete(board);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(board);
			});
		});
	});

	describe('deleteByExternalReference', () => {
		describe('when deleting a board', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				return {
					userId,
				};
			};

			it('should delete the board', async () => {
				const { userId } = setup();

				await service.deleteByExternalReference({ type: BoardExternalReferenceType.User, id: userId });

				expect(boardDoRepo.deleteByExternalReference).toHaveBeenCalledWith({
					type: BoardExternalReferenceType.User,
					id: userId,
				});
			});
		});
	});

	describe('findByDescendant', () => {
		describe('when a board for a descendant exists', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();
				const line = mediaLineFactory.build();

				boardDoService.getRootBoardDo.mockResolvedValueOnce(board);

				return {
					board,
					line,
				};
			};

			it('should return the board', async () => {
				const { board, line } = setup();

				const result = await service.findByDescendant(line);

				expect(result).toEqual(board);
			});
		});

		describe('when the board does not have the correct type', () => {
			const setup = () => {
				const board = columnBoardFactory.build();
				const line = mediaLineFactory.build();

				boardDoService.getRootBoardDo.mockResolvedValueOnce(board);

				return {
					board,
					line,
				};
			};

			it('should throw an exception', async () => {
				const { line } = setup();

				await expect(service.findByDescendant(line)).rejects.toThrow(InvalidBoardTypeLoggableException);
			});
		});
	});
});
