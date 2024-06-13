import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { BoardCommonToolService } from './board-common-tool.service';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';
import { ColumnBoard, MediaBoard, AnyBoardNode } from '../domain';

import { columnBoardFactory, mediaBoardFactory } from '../testing';

describe('BoardCommonToolService', () => {
	let module: TestingModule;
	let service: BoardCommonToolService;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;
	let boardNodeService: DeepMocked<BoardNodeService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardCommonToolService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
			],
		}).compile();

		service = module.get<BoardCommonToolService>(BoardCommonToolService);
		boardNodeRepo = module.get(BoardNodeRepo);
		boardNodeService = module.get(BoardNodeService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('countBoardUsageForExternalTools', () => {
		const setup = () => {
			const contextExternalTools = [contextExternalToolFactory.build(), contextExternalToolFactory.build()];

			const boardNodes: AnyBoardNode[] = [
				{ rootId: '1' } as AnyBoardNode,
				{ rootId: '2' } as AnyBoardNode,
				{ rootId: '1' } as AnyBoardNode,
			];
			boardNodeRepo.findByContextExternalToolIds.mockResolvedValue(boardNodes);

			return { contextExternalTools };
		};
		it('should count board usage for external tools', async () => {
			const { contextExternalTools } = setup();
			const result = await service.countBoardUsageForExternalTools(contextExternalTools);

			expect(result).toBe(2);
		});
	});

	describe('findByDescendant', () => {
		it('should return the root node when it is a ColumnBoard', async () => {
			const boardNode: AnyBoardNode = { id: '1', rootId: '2' } as AnyBoardNode;
			const rootNode: ColumnBoard = columnBoardFactory.build();
			boardNodeService.findRoot.mockResolvedValue(rootNode);

			const result = await service.findByDescendant(boardNode);

			expect(result).toBe(rootNode);
		});

		it('should return the root node when it is a MediaBoard', async () => {
			const boardNode: AnyBoardNode = { id: '1', rootId: '2' } as AnyBoardNode;
			const rootNode: MediaBoard = mediaBoardFactory.build();
			boardNodeService.findRoot.mockResolvedValue(rootNode);

			const result = await service.findByDescendant(boardNode);

			expect(result).toBe(rootNode);
		});

		it('should throw NotFoundException when root node is not a ColumnBoard or MediaBoard', async () => {
			const boardNode: AnyBoardNode = { id: '1', rootId: '2' } as AnyBoardNode;
			const rootNode: AnyBoardNode = { id: '2' } as AnyBoardNode;
			boardNodeService.findRoot.mockResolvedValue(rootNode);

			await expect(service.findByDescendant(boardNode)).rejects.toThrow(NotFoundException);
		});
	});
});
