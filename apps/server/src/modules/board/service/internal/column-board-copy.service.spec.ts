import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client/service';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { BoardExternalReferenceType } from '../../domain/types';
import { columnBoardFactory } from '../../testing/column-board.factory';
import { BoardNodeService } from '../board-node.service';
import { ColumnBoardCopyService, CopyColumnBoardParams } from './column-board-copy.service';
import { ColumnBoardTitleService } from './column-board-title.service';
// Warning: do not move the BoardNodeCopyService import up. Otherwise it will lead to dependency cycle.
import { BoardNodeCopyService } from './board-node-copy.service';

describe(ColumnBoardCopyService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardCopyService;

	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeCopyService: DeepMocked<BoardNodeCopyService>;
	let columnBoardTitleService: DeepMocked<ColumnBoardTitleService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ColumnBoardCopyService,
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: ColumnBoardTitleService,
					useValue: createMock<ColumnBoardTitleService>(),
				},
				{
					provide: BoardNodeCopyService,
					useValue: createMock<BoardNodeCopyService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		service = module.get(ColumnBoardCopyService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeCopyService = module.get(BoardNodeCopyService);
		columnBoardTitleService = module.get(ColumnBoardTitleService);

		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('copyColumnBoard', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const targetSchoolId = new ObjectId().toHexString();
			const course = courseEntityFactory.buildWithId();
			const originalBoard = columnBoardFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			boardNodeService.findByClassAndId.mockResolvedValueOnce(originalBoard);

			const boardCopy = columnBoardFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			const status: CopyStatus = {
				copyEntity: boardCopy,
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
			};
			boardNodeCopyService.copy.mockResolvedValueOnce(status);

			const copyParams: CopyColumnBoardParams = {
				originalColumnBoardId: originalBoard.id,
				targetExternalReference: originalBoard.context,
				sourceStorageLocationReference: { id: course.school.id, type: StorageLocation.SCHOOL },
				targetStorageLocationReference: { id: course.school.id, type: StorageLocation.SCHOOL },
				userId,
				copyTitle: 'Board Copy',
				targetSchoolId,
			};

			return { originalBoard, userId, copyParams };
		};

		it('should find the original board', async () => {
			const { copyParams } = setup();

			await service.copyColumnBoard(copyParams);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalled();
		});

		it('should call service to copy the board', async () => {
			const { copyParams } = setup();

			await service.copyColumnBoard(copyParams);

			expect(boardNodeCopyService.copy).toHaveBeenCalled();
		});

		it('should set the title of the copied board', async () => {
			const { copyParams } = setup();
			const copyTitle = 'Another Title';

			await service.copyColumnBoard({
				...copyParams,
				copyTitle,
			});

			expect(boardNodeService.addRoot).toHaveBeenCalledWith(expect.objectContaining({ title: copyTitle }));
		});

		it('should derive the title of the copied board', async () => {
			const { copyParams } = setup();
			const derivedTitle = 'Derived Title';
			columnBoardTitleService.deriveColumnBoardTitle.mockResolvedValueOnce(derivedTitle);

			await service.copyColumnBoard({
				...copyParams,
				copyTitle: undefined,
			});

			expect(boardNodeService.addRoot).toHaveBeenCalledWith(expect.objectContaining({ title: derivedTitle }));
		});

		it('should set the context of the copied board', async () => {
			const { copyParams } = setup();
			const targetExternalReference = {
				id: new ObjectId().toHexString(),
				type: BoardExternalReferenceType.Course,
			};

			await service.copyColumnBoard({ ...copyParams, targetExternalReference });

			expect(boardNodeService.addRoot).toHaveBeenCalledWith(
				expect.objectContaining({ context: targetExternalReference })
			);
		});

		it('should return the copy status', async () => {
			const { copyParams } = setup();
			const copyStatus = await service.copyColumnBoard(copyParams);

			expect(copyStatus).toBeDefined();
			expect(copyStatus.copyEntity).toBeDefined();
		});

		it('should not affect the original board', async () => {
			const { copyParams, originalBoard } = setup();
			const copyStatus = await service.copyColumnBoard(copyParams);

			expect(copyStatus.originalEntity).toBe(originalBoard);
		});
	});

	describe('when the copy response is not a ColumnBoard', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const targetSchoolId = new ObjectId().toHexString();
			const course = courseEntityFactory.buildWithId();
			const originalBoard = columnBoardFactory.build({
				context: { id: course.id, type: BoardExternalReferenceType.Course },
			});
			boardNodeService.findByClassAndId.mockResolvedValueOnce(originalBoard);

			const copyParams: CopyColumnBoardParams = {
				originalColumnBoardId: originalBoard.id,
				targetExternalReference: originalBoard.context,
				sourceStorageLocationReference: { id: course.school.id, type: StorageLocation.SCHOOL },
				targetStorageLocationReference: { id: course.school.id, type: StorageLocation.SCHOOL },
				userId,
				copyTitle: 'Board Copy',
				targetSchoolId,
			};

			return { originalBoard, userId, copyParams };
		};

		it('should throw an error if the board is not a column board', async () => {
			const { originalBoard, copyParams } = setup();

			const boardCopy = { ...originalBoard, id: new ObjectId().toHexString(), type: 'not-a-column-board' };
			const status: CopyStatus = {
				copyEntity: boardCopy,
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
			};
			boardNodeCopyService.copy.mockResolvedValueOnce(status);

			await expect(service.copyColumnBoard(copyParams)).rejects.toThrowError(
				'expected copy of columnboard to be a columnboard'
			);
		});
	});
});
