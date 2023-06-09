import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReference, BoardExternalReferenceType, ColumnBoard } from '@shared/domain';
import { columnBoardNodeFactory, setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ColumnBoardService } from './column-board.service';

describe(ColumnBoardService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardService,
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

		service = module.get(ColumnBoardService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();

		return { board, boardId, column };
	};

	describe('findById', () => {
		it('should call the board do repository', async () => {
			const { boardId, board } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			await service.findById(boardId);

			expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('should return the columnBoard object of the given', async () => {
			const { board } = setup();
			boardDoRepo.findByClassAndId.mockResolvedValueOnce(board);

			const result = await service.findById(board.id);

			expect(result).toEqual(board);
		});
	});

	describe('getBoardObjectTitlesById', () => {
		describe('when asking for a list of boardObject-ids', () => {
			const setupBoards = () => {
				return {
					boardNodes: columnBoardNodeFactory.buildListWithId(3),
				};
			};

			it('should call the boardDoRepo.getTitleById with the same parameters', async () => {
				const { boardNodes } = setupBoards();
				const ids = boardNodes.map((n) => n.id);

				await service.getBoardObjectTitlesById(ids);

				expect(boardDoRepo.getTitleById).toHaveBeenCalledWith(ids);
			});
		});
	});

	describe('create', () => {
		const setupBoards = () => {
			const context: BoardExternalReference = {
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			};

			return { context };
		};

		describe('when creating a fresh column board', () => {
			it('should return a columnBoardInfo of that board', async () => {
				const { context } = setupBoards();
				const title = `My brand new Mainboard`;

				const columnBoardInfo = await service.create(context, title);

				expect(columnBoardInfo).toEqual(expect.objectContaining({ title }));
			});
		});
	});

	describe('delete', () => {
		it('should call the service to delete the board', async () => {
			const { board } = setup();

			await service.delete(board);

			expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(board);
		});
	});

	describe('updateTitle', () => {
		describe('when updating the title', () => {
			it('should call the service', async () => {
				const board = columnBoardFactory.build();
				const newTitle = 'new title';

				await service.updateTitle(board, newTitle);

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: expect.any(String),
						title: newTitle,
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					})
				);
			});
		});
	});
});
