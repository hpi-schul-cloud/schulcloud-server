import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, ColumnBoard, UserDO } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { columnBoardFactory, courseFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { UserService } from '@src/modules/user';
import { BoardDoRepo } from '../repo';
import {
	BoardDoCopyService,
	SchoolSpecificFileCopyService,
	SchoolSpecificFileCopyServiceFactory,
} from './board-do-copy-service';
import { ColumnBoardCopyService } from './column-board-copy.service';

describe('column board copy service', () => {
	let module: TestingModule;
	let service: ColumnBoardCopyService;
	let doCopyService: DeepMocked<BoardDoCopyService>;
	let boardRepo: DeepMocked<BoardDoRepo>;
	let userService: DeepMocked<UserService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let fileCopyServiceFactory: DeepMocked<SchoolSpecificFileCopyServiceFactory>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: BoardDoCopyService,
					useValue: createMock<BoardDoCopyService>(),
				},
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: SchoolSpecificFileCopyServiceFactory,
					useValue: createMock<SchoolSpecificFileCopyServiceFactory>(),
				},
				ColumnBoardCopyService,
			],
		}).compile();

		service = module.get(ColumnBoardCopyService);
		doCopyService = module.get(BoardDoCopyService);
		boardRepo = module.get(BoardDoRepo);
		userService = module.get(UserService);
		courseRepo = module.get(CourseRepo);
		fileCopyServiceFactory = module.get(SchoolSpecificFileCopyServiceFactory);

		await setupEntities();
	});

	describe('when copying a column board', () => {
		const setup = () => {
			const originalSchool = schoolFactory.buildWithId();
			const targetSchool = schoolFactory.buildWithId();
			const course = courseFactory.buildWithId({ school: originalSchool });
			const originalExternalReference = {
				id: course.id,
				type: BoardExternalReferenceType.Course,
			};
			const originalBoard = columnBoardFactory.build({
				context: originalExternalReference,
			});

			const targetCourse = courseFactory.buildWithId();
			const destinationExternalReference = {
				id: targetCourse.id,
				type: BoardExternalReferenceType.Course,
			};

			const boardCopy = columnBoardFactory.build({
				context: originalExternalReference,
			});

			const expectedBoardCopy = {
				...boardCopy,
				props: { ...boardCopy.getProps(), context: destinationExternalReference },
			};

			const resultCopyStatus: CopyStatus = {
				type: CopyElementType.COLUMNBOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardCopy,
			};

			const expectedCopyStatus = {
				...resultCopyStatus,
				copyEntity: expectedBoardCopy,
			};

			const user = userFactory.buildWithId({ school: targetSchool });

			const fileCopyServiceMock = createMock<SchoolSpecificFileCopyService>();
			fileCopyServiceFactory.build.mockReturnValue(fileCopyServiceMock);

			boardRepo.findByClassAndId.mockResolvedValue(originalBoard);
			courseRepo.findById.mockResolvedValue(course);
			userService.findById.mockResolvedValue({ schoolId: user.school.id } as UserDO);
			doCopyService.copy.mockResolvedValue(resultCopyStatus);

			return {
				course,
				originalBoard,
				destinationExternalReference,
				user,
				resultCopyStatus,
				boardCopy,
				expectedBoardCopy,
				expectedCopyStatus,
				fileCopyServiceMock,
			};
		};

		it('should get column board do', async () => {
			const { originalBoard, destinationExternalReference, user } = setup();
			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(boardRepo.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, originalBoard.id);
		});

		it('should call copyService with column board do', async () => {
			const { fileCopyServiceMock, originalBoard, destinationExternalReference, user } = setup();
			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(doCopyService.copy).toHaveBeenCalledWith({
				fileCopyService: fileCopyServiceMock,
				original: originalBoard,
			});
		});

		it('should persist copy of board, with replaced externalReference', async () => {
			const { originalBoard, destinationExternalReference, user, expectedBoardCopy } = setup();
			await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(boardRepo.save).toHaveBeenCalledWith(expectedBoardCopy);
		});

		it('should return copyStatus', async () => {
			const { originalBoard, destinationExternalReference, user, expectedCopyStatus } = setup();
			const result = await service.copyColumnBoard({
				originalColumnBoardId: originalBoard.id,
				destinationExternalReference,
				userId: user.id,
			});

			expect(result).toEqual(expectedCopyStatus);
		});
	});
});
