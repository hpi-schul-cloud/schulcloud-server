import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { mediaBoardFactory, mediaExternalToolElementFactory, mediaLineFactory } from '../../testing';
import { BoardExternalReference, BoardExternalReferenceType, BoardLayout, MediaBoardColors } from '../../domain';
import { BoardNodeRepo } from '../../repo';
import { MediaBoardService } from './media-board.service';

describe('MediaBoardService', () => {
	let module: TestingModule;
	let service: MediaBoardService;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaBoardService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
			],
		}).compile();

		service = module.get<MediaBoardService>(MediaBoardService);
		boardNodeRepo = module.get(BoardNodeRepo);
		contextExternalToolService = module.get(ContextExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('findByExternalReference', () => {
		const setup = () => {
			const mediaBoard = mediaBoardFactory.build();
			boardNodeRepo.findByExternalReference.mockResolvedValueOnce([mediaBoard]);
			return { mediaBoard };
		};
		it('should call boardNodeRepo.findByExternalReference', async () => {
			const reference: BoardExternalReference = { type: BoardExternalReferenceType.User, id: 'id' };
			await service.findByExternalReference(reference);
			expect(boardNodeRepo.findByExternalReference).toHaveBeenCalledWith(reference);
		});
		it('should return MediaBoard', async () => {
			const { mediaBoard } = setup();
			const reference: BoardExternalReference = { type: BoardExternalReferenceType.User, id: 'id' };
			const result = await service.findByExternalReference(reference);
			expect(result).toEqual([mediaBoard]);
		});
	});

	describe('checkElementExists', () => {
		describe('when element does not exist', () => {
			const setup = () => {
				const schoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool = contextExternalToolFactory.build({ schoolToolRef: schoolExternalTool });
				const mediaExternalToolElement = mediaExternalToolElementFactory.build({
					contextExternalToolId: contextExternalTool.id,
				});
				const mediaLine = mediaLineFactory.build({ children: [mediaExternalToolElement] });
				const mediaBoard = mediaBoardFactory.build({ children: [mediaLine] });

				contextExternalToolService.findContextExternalTools.mockResolvedValue([]);

				return { schoolExternalTool, mediaBoard };
			};
			it('should call findContextExternalTools', async () => {
				const schoolExternalTool = schoolExternalToolFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				contextExternalToolService.findContextExternalTools.mockResolvedValue([]);
				await service.checkElementExists(mediaBoard, schoolExternalTool);
				expect(contextExternalToolService.findContextExternalTools).toHaveBeenCalledWith({
					schoolToolRef: { schoolToolId: schoolExternalTool.id },
				});
			});
			it('should return false if element does not exist in MediaBoard', async () => {
				const { schoolExternalTool, mediaBoard } = setup();
				const exists = await service.checkElementExists(mediaBoard, schoolExternalTool);
				expect(exists).toBe(false);
			});
		});

		describe('when element exists', () => {
			const setup = () => {
				const schoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool = contextExternalToolFactory.build({ schoolToolRef: schoolExternalTool });
				const mediaExternalToolElement = mediaExternalToolElementFactory.build({
					contextExternalToolId: contextExternalTool.id,
				});
				const mediaLine = mediaLineFactory.build({ children: [mediaExternalToolElement] });
				const mediaBoard = mediaBoardFactory.build({ children: [mediaLine] });

				contextExternalToolService.findContextExternalTools.mockResolvedValue([contextExternalTool]);

				return { schoolExternalTool, mediaBoard };
			};
			it('should return true if element exists in MediaBoard', async () => {
				const { schoolExternalTool, mediaBoard } = setup();
				const exists = await service.checkElementExists(mediaBoard, schoolExternalTool);
				expect(exists).toBe(true);
			});
		});
	});

	describe('createContextExternalToolForMediaBoard', () => {
		const setup = () => {
			const mediaBoard = mediaBoardFactory.build();
			const schoolExternalTool = schoolExternalToolFactory.build();
			const contextExternalTool = contextExternalToolFactory.build();
			contextExternalToolService.saveContextExternalTool.mockResolvedValue(contextExternalTool);
			return { mediaBoard, schoolExternalTool, contextExternalTool };
		};
		it('should call saveContextExternalTool', async () => {
			const { mediaBoard, schoolExternalTool } = setup();
			await service.createContextExternalToolForMediaBoard('1', schoolExternalTool, mediaBoard);
			expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalled();
		});
		it('should return contextExternalTool', async () => {
			const { mediaBoard, schoolExternalTool, contextExternalTool } = setup();
			const result = await service.createContextExternalToolForMediaBoard('1', schoolExternalTool, mediaBoard);
			expect(result).toBe(contextExternalTool);
		});
	});

	describe('update functions', () => {
		const setup = () => {
			const mediaBoard = mediaBoardFactory.build();
			return { mediaBoard };
		};
		it('should update MediaBoard backgroundColor', async () => {
			const { mediaBoard } = setup();
			await service.updateBackgroundColor(mediaBoard, MediaBoardColors.TRANSPARENT);
			expect(mediaBoard.backgroundColor).toBe(MediaBoardColors.TRANSPARENT);
			expect(boardNodeRepo.save).toHaveBeenCalledWith(mediaBoard);
		});

		it('should update MediaBoard collapsed state', async () => {
			const { mediaBoard } = setup();
			await service.updateCollapsed(mediaBoard, true);
			expect(mediaBoard.collapsed).toBe(true);
			expect(boardNodeRepo.save).toHaveBeenCalledWith(mediaBoard);
		});

		it('should update MediaBoard layout', async () => {
			const { mediaBoard } = setup();
			await service.updateLayout(mediaBoard, BoardLayout.GRID);
			expect(mediaBoard.layout).toBe(BoardLayout.GRID);
			expect(boardNodeRepo.save).toHaveBeenCalledWith(mediaBoard);
		});
	});
});
