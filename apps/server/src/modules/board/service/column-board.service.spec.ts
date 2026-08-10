import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-amqp-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, type CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { Test, type TestingModule } from '@nestjs/testing';
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

	describe('swapLinkedIdsInCopy', () => {
		describe('when copyEntity is undefined', () => {
			it('should return the copy status without calling the link service', async () => {
				const copyStatus: CopyStatus = { status: CopyStatusEnum.SUCCESS, type: CopyElementType.COLUMNBOARD };

				const result = await service.updateIdsInLinks(copyStatus);

				expect(result).toBe(copyStatus);
				expect(columnBoardLinkService.rewriteLinkUrlsInBoardNode).not.toHaveBeenCalled();
			});
		});

		describe('when copyEntity is not a board node', () => {
			it('should return copy status and skip link updates', async () => {
				const copyStatus: CopyStatus = {
					status: CopyStatusEnum.SUCCESS,
					type: CopyElementType.COLUMNBOARD,
					copyEntity: { id: 'not-a-board-node' },
				};

				const result = await service.updateIdsInLinks(copyStatus);

				expect(result).toBe(copyStatus);
				expect(columnBoardLinkService.rewriteLinkUrlsInBoardNode).not.toHaveBeenCalled();
			});
		});

		describe('when copyEntity is a valid board node', () => {
			const setup = () => {
				const node = columnBoardFactory.build();
				const idMap = { ['id1']: 'id2' };

				columnBoardLinkService.rewriteLinkUrlsInBoardNode.mockResolvedValueOnce(node);
				copyHelperService.buildReplacementMap.mockReturnValue(idMap);

				const copyStatus: CopyStatus = {
					status: CopyStatusEnum.SUCCESS,
					type: CopyElementType.COLUMNBOARD,
					copyEntity: node,
				};

				return { node, idMap, copyStatus };
			};

			it('should call buildCopyEntityDict', async () => {
				const { copyStatus } = setup();

				await service.updateIdsInLinks(copyStatus);

				expect(copyHelperService.buildReplacementMap).toHaveBeenCalledWith(copyStatus);
			});

			it('should call swapLinkedIdsInBoardNode with the copy entity', async () => {
				const { node, idMap, copyStatus } = setup();

				await service.updateIdsInLinks(copyStatus);

				expect(columnBoardLinkService.rewriteLinkUrlsInBoardNode).toHaveBeenCalledWith(node, idMap);
			});

			it('should return copy status with updated copyEntity', async () => {
				const { node, copyStatus } = setup();

				const result = await service.updateIdsInLinks(copyStatus);

				expect(result).toBe(copyStatus);
				expect(result.copyEntity).toEqual(node);
			});
		});
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
});
