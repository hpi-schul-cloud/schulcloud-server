import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { Test, TestingModule } from '@nestjs/testing';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	ContentElementFactory,
} from '@shared/domain/domainobject';
import { columnBoardNodeFactory, setupEntities } from '@shared/testing';
import { columnBoardFactory, columnFactory, richTextElementFactory } from '@shared/testing/factory/domainobject';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ColumnBoardService } from './column-board.service';

describe(ColumnBoardService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let configBefore: IConfig;

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
				{
					provide: ContentElementFactory,
					useValue: createMock<ContentElementFactory>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		configBefore = Configuration.toObject({ plainSecrets: true });
		await setupEntities();
	});

	afterEach(() => {
		jest.clearAllMocks();
		Configuration.reset(configBefore);
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();
		const courseId = new ObjectId().toHexString();
		const externalReference: BoardExternalReference = {
			id: courseId,
			type: BoardExternalReferenceType.Course,
		};

		return { board, boardId, column, courseId, externalReference };
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

	describe('findIdsByExternalReference', () => {
		it('should call the board do repository', async () => {
			const { boardId, externalReference } = setup();

			boardDoRepo.findIdsByExternalReference.mockResolvedValue([boardId]);

			await service.findIdsByExternalReference(externalReference);

			expect(boardDoRepo.findIdsByExternalReference).toHaveBeenCalledWith(externalReference);
		});
	});

	describe('findByDescendant', () => {
		const setup2 = () => {
			const element = richTextElementFactory.build();
			const board = columnBoardFactory.build({ children: [element] });
			boardDoService.getRootBoardDo.mockResolvedValue(board);
			return {
				element,
				board,
			};
		};

		it('should call board-do service to get the rootDo', async () => {
			const { element } = setup2();

			await service.findByDescendant(element);

			expect(boardDoService.getRootBoardDo).toHaveBeenCalledWith(element);
		});

		it('should return the root boardDo', async () => {
			const { element, board } = setup2();

			const result = await service.findByDescendant(element);

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

				expect(boardDoRepo.getTitlesByIds).toHaveBeenCalledWith(ids);
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

	describe('deleteByCourseId', () => {
		describe('when deleting by courseId', () => {
			it('should call boardDoRepo.findIdsByExternalReference to find the board ids', async () => {
				const { boardId, courseId, externalReference } = setup();

				boardDoRepo.findIdsByExternalReference.mockResolvedValue([boardId]);

				await service.deleteByCourseId(courseId);

				expect(boardDoRepo.findIdsByExternalReference).toHaveBeenCalledWith(externalReference);
			});

			it('should call boardDoService.deleteWithDescendants to delete the board', async () => {
				const { board, courseId } = setup();

				await service.deleteByCourseId(courseId);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(board);
			});
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

	describe('updateBoardVisibility', () => {
		it('should call the boardDoRepo.save with the updated board', async () => {
			const board = columnBoardFactory.build();
			const isVisible = true;

			await service.updateBoardVisibility(board, isVisible);

			expect(boardDoRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: board.id,
					isVisible,
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				})
			);
		});
	});
});
