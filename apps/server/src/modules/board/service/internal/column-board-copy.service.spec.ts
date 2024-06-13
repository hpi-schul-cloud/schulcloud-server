import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@shared/repo';
import { courseFactory, setupEntities, userDoFactory } from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { BoardExternalReferenceType, ColumnBoard } from '../../domain';
import { columnBoardFactory } from '../../testing';
import { BoardNodeService } from '../board-node.service';
import { BoardNodeCopyService } from './board-node-copy.service';
import { ColumnBoardCopyService } from './column-board-copy.service';
import { ColumnBoardTitleService } from './column-board-title.service';

describe(ColumnBoardCopyService.name, () => {
	let module: TestingModule;
	let service: ColumnBoardCopyService;

	let boardNodeService: DeepMocked<BoardNodeService>;
	// let columnBoardTitleService: DeepMocked<ColumnBoardTitleService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let userService: DeepMocked<UserService>;
	let boardNodeCopyService: DeepMocked<BoardNodeCopyService>;
	// let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

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
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
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
		courseRepo = module.get(CourseRepo);
		userService = module.get(UserService);
		boardNodeCopyService = module.get(BoardNodeCopyService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const userId = new ObjectId().toHexString();
		const user = userDoFactory.build({ id: userId });
		userService.findById.mockResolvedValueOnce(user);
		const course = courseFactory.buildWithId();
		courseRepo.findById.mockResolvedValueOnce(course);
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

		return { originalBoard, userId };
	};

	it('should copy the board', async () => {
		const { originalBoard, userId } = setup();

		const result = await service.copyColumnBoard({
			originalColumnBoardId: originalBoard.id,
			destinationExternalReference: originalBoard.context,
			userId,
			copyTitle: 'Another Title',
		});

		expect(boardNodeCopyService.copy).toHaveBeenCalled();
		expect((result.copyEntity as ColumnBoard).title).toBe('Another Title');
	});
});
