import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-amqp-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, type CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { Test, type TestingModule } from '@nestjs/testing';
import { type AuthorizableObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import {
	type BoardExternalReference,
	BoardExternalReferenceType,
	BoardNodeFactory,
	ColumnBoard,
	type ColumnBoardProps,
} from '../domain';
import { BoardNodeRepo } from '../repo';
import { columnBoardFactory } from '../testing';
import { BoardNodeService } from './board-node.service';
import { ColumnBoardService } from './column-board.service';
import { BoardCopyService, ColumnBoardLinkService } from './internal';

describe('ColumnBoardService', () => {
	let module: TestingModule;
	let service: ColumnBoardService;
	let repo: DeepMocked<BoardNodeRepo>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardCopyService: DeepMocked<BoardCopyService>;
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
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
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
		boardCopyService = module.get(BoardCopyService);
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
		boardCopyService.copyColumnBoard.mockResolvedValueOnce(copyStatus);
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

	it('should copy Card', async () => {
		const expectedCopyStatus: CopyStatus = { status: CopyStatusEnum.SUCCESS, type: CopyElementType.CARD };
		boardCopyService.copyCard.mockResolvedValueOnce(expectedCopyStatus);
		const returnedCopyStatus = await service.copyCard({
			originalCardId: '1',
			sourceStorageLocationReference: { id: '1', type: StorageLocation.SCHOOL },
			targetStorageLocationReference: { id: '1', type: StorageLocation.SCHOOL },
			userId: '1',
			targetSchoolId: new ObjectId().toHexString(),
		});

		expect(returnedCopyStatus).toEqual(expectedCopyStatus);
	});

	it('should delegate swapLinkedIdsInBoardNode to columnBoardLinkService', async () => {
		const idMap = new Map<EntityId, EntityId>();
		idMap.set('1', '2');
		const board = columnBoardFactory.build();
		columnBoardLinkService.swapLinkedIdsInBoardNode.mockResolvedValueOnce(board);

		const result = await service.swapLinkedIdsInBoardNode('1', idMap);

		expect(columnBoardLinkService.swapLinkedIdsInBoardNode).toHaveBeenCalledWith('1', idMap);
		expect(result).toEqual(board);
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
		const setup = (type: CopyElementType, withCopyEntity = false) => {
			const board = columnBoardFactory.build();
			const idMap = new Map<EntityId, EntityId>();
			idMap.set('id1', 'id2');

			columnBoardLinkService.swapLinkedIdsInBoardNode.mockResolvedValue(board);
			copyHelperService.buildCopyEntityDict.mockReturnValue(new Map<EntityId, AuthorizableObject>());

			const copyStatus: CopyStatus = {
				status: CopyStatusEnum.SUCCESS,
				type: CopyElementType.ROOM,
				elements: [
					{
						type,
						status: CopyStatusEnum.SUCCESS,
						copyEntity: withCopyEntity ? board : undefined,
					},
				],
			};

			return { board, idMap, copyStatus };
		};

		it('should call copyHelperService.buildCopyEntityDict', async () => {
			const { copyStatus } = setup(CopyElementType.COLUMNBOARD);

			await service.swapLinkedIdsInCopy(copyStatus);

			expect(copyHelperService.buildCopyEntityDict).toHaveBeenCalledWith(copyStatus);
		});

		it('should return copy status with updated linked ids', async () => {
			const { copyStatus } = setup(CopyElementType.COLUMNBOARD, true);

			const result = await service.swapLinkedIdsInCopy(copyStatus);

			expect(result).toEqual(copyStatus);
			expect(result.elements?.[0].copyEntity).toEqual(copyStatus.elements?.[0].copyEntity);
		});

		describe.each([
			{ type: CopyElementType.COLUMNBOARD, label: 'COLUMNBOARD' },
			{ type: CopyElementType.COLUMN, label: 'COLUMN' },
		])('when top-level copyStatus.type is $label', ({ type }) => {
			const setupTopLevel = () => {
				const node = columnBoardFactory.build();
				const idMap = new Map<EntityId, EntityId>();
				idMap.set('id1', 'id2');

				columnBoardLinkService.swapLinkedIdsInBoardNode.mockResolvedValueOnce(node);
				copyHelperService.buildCopyEntityDict.mockReturnValue(new Map<EntityId, AuthorizableObject>());

				const copyStatus: CopyStatus = {
					status: CopyStatusEnum.SUCCESS,
					type,
					copyEntity: node,
					elements: [],
				};

				return { node, idMap, copyStatus };
			};

			it('should call swapLinkedIdsInBoardNode with the copy entity id', async () => {
				const { node, idMap, copyStatus } = setupTopLevel();

				await service.swapLinkedIdsInCopy(copyStatus, idMap);

				expect(columnBoardLinkService.swapLinkedIdsInBoardNode).toHaveBeenCalledWith(node.id, idMap);
			});
		});

		describe.each([
			{ type: CopyElementType.COLUMNBOARD, label: 'COLUMNBOARD' },
			{ type: CopyElementType.COLUMN, label: 'COLUMN' },
		])('when a sub-element type is $label', ({ type }) => {
			it('should call swapLinkedIdsInBoardNode for the element', async () => {
				const { board, idMap, copyStatus } = setup(type, true);

				await service.swapLinkedIdsInCopy(copyStatus, idMap);

				expect(columnBoardLinkService.swapLinkedIdsInBoardNode).toHaveBeenCalledWith(board.id, idMap);
			});

			it('should skip the element if it has no copyEntity', async () => {
				const { copyStatus } = setup(type, false);

				await service.swapLinkedIdsInCopy(copyStatus);

				expect(columnBoardLinkService.swapLinkedIdsInBoardNode).not.toHaveBeenCalled();
			});
		});
	});
});
