import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { CopyElementType, CopyStatus, CopyStatusEnum, CopyHelperService } from '@modules/copy-helper';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardNodeFactory,
	ColumnBoard,
	ColumnBoardProps,
} from '../domain';
import { BoardNodeRepo } from '../repo';
import { columnBoardFactory } from '../testing';
import { BoardNodeService } from './board-node.service';
import { ColumnBoardService } from './column-board.service';
import { ColumnBoardCopyService, ColumnBoardLinkService } from './internal';

describe('ColumnBoardService', () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let repo: DeepMocked<BoardNodeRepo>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let columnBoardCopyService: DeepMocked<ColumnBoardCopyService>;
	let columnBoardLinkService: DeepMocked<ColumnBoardLinkService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

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
				BoardNodeFactory,
				{
					provide: ColumnBoardCopyService,
					useValue: createMock<ColumnBoardCopyService>(),
				},
				{
					provide: ColumnBoardLinkService,
					useValue: createMock<ColumnBoardLinkService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		service = module.get<ColumnBoardService>(ColumnBoardService);
		repo = module.get(BoardNodeRepo);
		boardNodeService = module.get(BoardNodeService);
		columnBoardCopyService = module.get(ColumnBoardCopyService);
		columnBoardLinkService = module.get(ColumnBoardLinkService);
		copyHelperService = module.get(CopyHelperService);
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
		repo.findByExternalReference.mockResolvedValueOnce([columnBoard]);
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

	it('should update ColumnBoard readersCanEdit', async () => {
		const columnBoard = columnBoardFactory.build();

		await service.updateReadersCanEdit(columnBoard, true);
		expect(columnBoard.readersCanEdit).toEqual(true);

		await service.updateReadersCanEdit(columnBoard, false);
		expect(columnBoard.readersCanEdit).toEqual(false);
	});

	it('should delete ColumnBoards by course id', async () => {
		const columnBoard = columnBoardFactory.build();
		repo.findByExternalReference.mockResolvedValueOnce([columnBoard]);
		const reference: BoardExternalReference = {
			type: BoardExternalReferenceType.Course,
			id: '1',
		};

		await service.deleteByCourseId('1');

		expect(repo.findByExternalReference).toHaveBeenCalledWith(reference, undefined);
		expect(boardNodeService.delete).toHaveBeenCalledWith(columnBoard);
	});

	it('should delete ColumnBoards by external reference', async () => {
		const columnBoard = columnBoardFactory.build();
		repo.findByExternalReference.mockResolvedValueOnce([columnBoard]);
		const reference: BoardExternalReference = {
			type: BoardExternalReferenceType.Room,
			id: '42',
		};

		await service.deleteByExternalReference(reference);

		expect(repo.findByExternalReference).toHaveBeenCalledWith(reference, undefined);
		expect(boardNodeService.delete).toHaveBeenCalledWith(columnBoard);
	});

	it('should copy ColumnBoard', async () => {
		const copyStatus: CopyStatus = { status: CopyStatusEnum.SUCCESS, type: CopyElementType.COLUMNBOARD };
		columnBoardCopyService.copyColumnBoard.mockResolvedValueOnce(copyStatus);
		const result = await service.copyColumnBoard({
			originalColumnBoardId: '1',
			targetExternalReference: {
				type: BoardExternalReferenceType.Course,
				id: '1',
			},
			sourceStorageLocationReference: { id: '1', type: StorageLocation.SCHOOL },
			targetStorageLocationReference: { id: '1', type: StorageLocation.SCHOOL },
			userId: '1',
			targetSchoolId: new ObjectId().toHexString(),
		});

		expect(result).toEqual(copyStatus);
	});

	it('should swap Linked Ids', async () => {
		const idMap = new Map<EntityId, EntityId>();
		idMap.set('1', '2');
		const columnBoard = columnBoardFactory.build();
		columnBoardLinkService.swapLinkedIds.mockResolvedValueOnce(columnBoard);

		const result = await service.swapLinkedIds('1', idMap);

		expect(result).toEqual(columnBoard);
	});

	describe('createColumnBoard', () => {
		describe('when creating new ColumnBoard', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build() as unknown as ColumnBoardProps;

				repo.save.mockResolvedValue();

				return { columnBoard };
			};

			it('should call BoardNodeRepo', async () => {
				const { columnBoard } = setup();

				await service.createColumnBoard(columnBoard);

				expect(repo.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('swapLinkedIdsInBoards', () => {
		const setup = () => {
			const board = columnBoardFactory.build();

			const idMap = new Map<EntityId, EntityId>();
			idMap.set('id1', 'id2');
			columnBoardLinkService.swapLinkedIds.mockResolvedValueOnce(board);

			copyHelperService.buildCopyEntityDict.mockReturnValue(new Map<EntityId, AuthorizableObject>());

			const copyStatus: CopyStatus = {
				status: CopyStatusEnum.SUCCESS,
				type: CopyElementType.ROOM,
				elements: [
					{
						type: CopyElementType.COLUMNBOARD,
						status: CopyStatusEnum.SUCCESS,
						copyEntity: board,
					},
				],
			};

			return { board, idMap, copyStatus };
		};

		it('should call copyHelperService.buildCopyEntityDict', async () => {
			const { copyStatus } = setup();

			await service.swapLinkedIdsInBoards(copyStatus);

			expect(copyHelperService.buildCopyEntityDict).toHaveBeenCalledWith(copyStatus);
		});

		it('should call columnBoardLinkService.swapLinkedIds', async () => {
			const { board, idMap, copyStatus } = setup();

			await service.swapLinkedIdsInBoards(copyStatus, idMap);

			expect(columnBoardLinkService.swapLinkedIds).toHaveBeenCalledWith(board.id, idMap);
		});

		it('should call columnBoardLinkService.swapLinkedIds without idMap ', async () => {
			const { copyStatus, board } = setup();

			await service.swapLinkedIdsInBoards(copyStatus);

			expect(columnBoardLinkService.swapLinkedIds).toHaveBeenCalledWith(board.id, expect.any(Map));
		});

		it('should return copy status with updated linked ids', async () => {
			const { copyStatus } = setup();

			const result = await service.swapLinkedIdsInBoards(copyStatus);

			expect(result).toEqual(copyStatus);
			expect(result.elements?.[0].copyEntity).toEqual(copyStatus.elements?.[0].copyEntity);
		});
	});
});
