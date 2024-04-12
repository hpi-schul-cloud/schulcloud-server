import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ToolContextType } from '@modules/tool/common/enum';
import type { ContextExternalToolWithId } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { SchoolExternalToolWithId } from '@modules/tool/school-external-tool/domain';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	contextExternalToolFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	schoolExternalToolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';
import { MediaElementService } from './media-element.service';

describe(MediaElementService.name, () => {
	let module: TestingModule;
	let service: MediaElementService;

	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

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
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(MediaElementService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		contextExternalToolService = module.get(ContextExternalToolService);

		await setupEntities();
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

	describe('createContextExternalToolForMediaBoard', () => {
		describe('when creating a new context external tool', () => {
			const setup = () => {
				const user = userFactory.build();
				const schoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.build() as SchoolExternalToolWithId;
				const mediaBoard = mediaBoardFactory.build();
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, user.school.id)
					.withContextRef(mediaBoard.id, ToolContextType.MEDIA_BOARD)
					.buildWithId() as ContextExternalToolWithId;

				contextExternalToolService.saveContextExternalTool.mockResolvedValueOnce(contextExternalTool);

				return {
					user,
					mediaBoard,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return the context external tool', async () => {
				const { user, schoolExternalTool, contextExternalTool, mediaBoard } = setup();

				const result = await service.createContextExternalToolForMediaBoard(user, schoolExternalTool, mediaBoard);

				expect(result).toEqual({
					id: contextExternalTool.id,
					displayName: contextExternalTool.displayName,
					schoolToolRef: {
						schoolId: user.school.id,
						schoolToolId: schoolExternalTool.id,
					},
					contextRef: {
						id: mediaBoard.id,
						type: ToolContextType.MEDIA_BOARD,
					},
					toolVersion: contextExternalTool.toolVersion,
					parameters: contextExternalTool.parameters,
				});
			});

			it('should save the new context external tool', async () => {
				const { user, schoolExternalTool, mediaBoard } = setup();

				await service.createContextExternalToolForMediaBoard(user, schoolExternalTool, mediaBoard);

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith({
					schoolToolRef: {
						schoolId: user.school.id,
						schoolToolId: schoolExternalTool.id,
					},
					contextRef: {
						id: mediaBoard.id,
						type: ToolContextType.MEDIA_BOARD,
					},
					toolVersion: 0,
					parameters: [],
				});
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

				const result = await service.createExternalToolElement(line, 0, contextExternalTool);

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

				const result = await service.createExternalToolElement(line, 0, contextExternalTool);

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
