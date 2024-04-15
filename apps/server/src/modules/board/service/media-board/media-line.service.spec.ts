import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { mediaBoardFactory, mediaLineFactory } from '@shared/testing';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';
import { MediaLineService } from './media-line.service';

describe(MediaLineService.name, () => {
	let module: TestingModule;
	let service: MediaLineService;

	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaLineService,
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

		service = module.get(MediaLineService);
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
		describe('when a line with the id exists', () => {
			const setup = () => {
				const line = mediaLineFactory.build();

				boardDoRepo.findByClassAndId.mockResolvedValueOnce(line);

				return {
					line,
				};
			};

			it('should return the line', async () => {
				const { line } = setup();

				const result = await service.findById(line.id);

				expect(result).toEqual(line);
			});
		});
	});

	describe('create', () => {
		describe('when creating a new line', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();

				return {
					board,
				};
			};

			it('should return the line', async () => {
				const { board } = setup();

				const result = await service.create(board, { title: 'lineTitle' });

				expect(result).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
						title: 'lineTitle',
					})
				);
			});

			it('should save the new line', async () => {
				const { board } = setup();

				const result = await service.create(board);

				expect(boardDoRepo.save).toHaveBeenCalledWith([result], board);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting a line', () => {
			const setup = () => {
				const line = mediaLineFactory.build();

				return {
					line,
				};
			};

			it('should delete the element', async () => {
				const { line } = setup();

				await service.delete(line);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(line);
			});
		});
	});

	describe('move', () => {
		describe('when deleting a line', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();
				const line = mediaLineFactory.build();

				return {
					line,
					board,
				};
			};

			it('should move the line', async () => {
				const { line, board } = setup();

				await service.move(line, board, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(line, board, 3);
			});
		});
	});

	describe('updateTitle', () => {
		describe('when updating the title', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();
				const line = mediaLineFactory.build();

				boardDoRepo.findParentOfId.mockResolvedValueOnce(board);

				return {
					line,
					board,
				};
			};

			it('should update the title', async () => {
				const { line, board } = setup();

				await service.updateTitle(line, 'newTitle');

				expect(boardDoRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						id: line.id,
						title: 'newTitle',
					}),
					board
				);
			});
		});
	});
});
