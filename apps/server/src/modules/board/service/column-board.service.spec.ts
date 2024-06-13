import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ColumnBoardService } from './column-board.service';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';
import { ColumnBoardCopyService, ColumnBoardLinkService } from './internal';
import { ColumnBoard, BoardExternalReference, BoardExternalReferenceType } from '../domain';

import { columnBoardFactory } from '../testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../../copy-helper';

describe('ColumnBoardService', () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let repo: jest.Mocked<BoardNodeRepo>;
	let boardNodeService: jest.Mocked<BoardNodeService>;
	let columnBoardCopyService: DeepMocked<ColumnBoardCopyService>;
	let columnBoardLinkService: DeepMocked<ColumnBoardLinkService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: ColumnBoardCopyService,
					useValue: createMock<ColumnBoardCopyService>(),
				},
				{
					provide: ColumnBoardLinkService,
					useValue: createMock<ColumnBoardLinkService>(),
				},
			],
		}).compile();

		service = module.get<ColumnBoardService>(ColumnBoardService);
		repo = module.get(BoardNodeRepo);
		boardNodeService = module.get(BoardNodeService);
		columnBoardCopyService = module.get(ColumnBoardCopyService);
		columnBoardLinkService = module.get(ColumnBoardLinkService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should find ColumnBoard by id', async () => {
		const columnBoard = columnBoardFactory.build();
		boardNodeService.findByClassAndId.mockResolvedValue(columnBoard);

		const result = await service.findById('1');

		expect(result).toBe(columnBoard);
		expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, '1', undefined);
	});

	it('should find ColumnBoards by external reference', async () => {
		const columnBoard = columnBoardFactory.build();
		repo.findByExternalReference.mockResolvedValue([columnBoard]);
		const reference: BoardExternalReference = {
			type: BoardExternalReferenceType.Course,
			id: '1',
		};

		const result = await service.findByExternalReference(reference);

		expect(result).toEqual([columnBoard]);
		expect(repo.findByExternalReference).toHaveBeenCalledWith(reference, undefined);
	});

	it('should update ColumnBoard visibility', async () => {
		const columnBoard = columnBoardFactory.build();

		await service.updateVisibility(columnBoard, true);

		expect(boardNodeService.updateVisibility).toHaveBeenCalledWith(columnBoard, true);
	});

	it('should delete ColumnBoards by course id', async () => {
		const columnBoard = columnBoardFactory.build();
		repo.findByExternalReference.mockResolvedValue([columnBoard]);
		const reference: BoardExternalReference = {
			type: BoardExternalReferenceType.Course,
			id: '1',
		};

		await service.deleteByCourseId('1');

		expect(repo.findByExternalReference).toHaveBeenCalledWith(reference, undefined);
		expect(repo.delete).toHaveBeenCalledWith([columnBoard]);
	});

	it('should copy ColumnBoard', async () => {
		const copyStatus: CopyStatus = { status: CopyStatusEnum.SUCCESS, type: CopyElementType.COLUMNBOARD };
		columnBoardCopyService.copyColumnBoard.mockResolvedValue(copyStatus);
		const result = await service.copyColumnBoard({
			originalColumnBoardId: '1',
			destinationExternalReference: {
				type: BoardExternalReferenceType.Course,
				id: '1',
			},
			userId: '1',
		});

		expect(result).toEqual(copyStatus);
	});

	it('should swap Linked Ids', async () => {
		const idMap = new Map<EntityId, EntityId>();
		idMap.set('1', '2');
		const columnBoard = columnBoardFactory.build();
		columnBoardLinkService.swapLinkedIds.mockResolvedValue(columnBoard);

		const result = await service.swapLinkedIds('1', idMap);

		expect(result).toEqual(columnBoard);
	});
});
