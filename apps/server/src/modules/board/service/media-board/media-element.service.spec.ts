import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	contextExternalToolFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
} from '@shared/testing';
import type { ContextExternalToolWithId } from '../../../tool/context-external-tool/domain';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';
import { MediaElementService } from './media-element.service';

describe(MediaElementService.name, () => {
	let module: TestingModule;
	let service: MediaElementService;

	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaElementService,
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

		service = module.get(MediaElementService);
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
		describe('when an element with the id exists', () => {
			const setup = () => {
				const element = mediaExternalToolElementFactory.build();

				boardDoRepo.findById.mockResolvedValueOnce(element);

				return {
					element,
				};
			};

			it('should return the element', async () => {
				const { element } = setup();

				const result = await service.findById(element.id);

				expect(result).toEqual(element);
			});
		});

		describe('when no element with the id exists', () => {
			const setup = () => {
				const board = mediaBoardFactory.build();

				boardDoRepo.findById.mockResolvedValueOnce(board);

				return {
					board,
				};
			};

			it('should return the element', async () => {
				const { board } = setup();

				await expect(service.findById(board.id)).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('createExternalToolElement', () => {
		describe('when creating a new element', () => {
			const setup = () => {
				const line = mediaLineFactory.build();
				const contextExternalTool = contextExternalToolFactory.buildWithId() as ContextExternalToolWithId;

				return {
					line,
					contextExternalTool,
				};
			};

			it('should return the element', async () => {
				const { line, contextExternalTool } = setup();

				const result = await service.createExternalToolElement(line, contextExternalTool);

				expect(result).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						children: [],
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
						contextExternalToolId: contextExternalTool.id,
					})
				);
			});

			it('should save the new element', async () => {
				const { line, contextExternalTool } = setup();

				const result = await service.createExternalToolElement(line, contextExternalTool);

				expect(boardDoRepo.save).toHaveBeenCalledWith([result], line);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting an element', () => {
			const setup = () => {
				const element = mediaExternalToolElementFactory.build();

				return {
					element,
				};
			};

			it('should delete the element', async () => {
				const { element } = setup();

				await service.delete(element);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('move', () => {
		describe('when deleting an element', () => {
			const setup = () => {
				const line = mediaLineFactory.build();
				const element = mediaExternalToolElementFactory.build();

				return {
					line,
					element,
				};
			};

			it('should move the element', async () => {
				const { line, element } = setup();

				await service.move(element, line, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(element, line, 3);
			});
		});
	});
});
