import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import { boardFactory, courseFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { BoardCopyService } from './board-copy.service';
import { CourseCopyService } from './course-copy.service';
import { CourseEntityCopyService } from './course-entity-copy.service';
import { LessonCopyService } from './lesson-copy.service';
import { RoomsService } from './rooms.service';

describe('course copy service', () => {
	let service: CourseCopyService;
	let courseRepo: DeepMocked<CourseRepo>;
	let boardRepo: DeepMocked<BoardRepo>;
	let roomsService: DeepMocked<RoomsService>;
	let courseEntityCopyService: DeepMocked<CourseEntityCopyService>;
	let boardCopyService: DeepMocked<BoardCopyService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let fileCopyAppendService: DeepMocked<FileCopyAppendService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let authorization: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				CourseCopyService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
				{
					provide: RoomsService,
					useValue: createMock<RoomsService>(),
				},
				{
					provide: CourseEntityCopyService,
					useValue: createMock<CourseEntityCopyService>(),
				},
				{
					provide: BoardCopyService,
					useValue: createMock<BoardCopyService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
				{
					provide: FileCopyAppendService,
					useValue: createMock<FileCopyAppendService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		service = module.get(CourseCopyService);
		courseRepo = module.get(CourseRepo);
		boardRepo = module.get(BoardRepo);
		roomsService = module.get(RoomsService);
		courseEntityCopyService = module.get(CourseEntityCopyService);
		boardCopyService = module.get(BoardCopyService);
		lessonCopyService = module.get(LessonCopyService);
		fileCopyAppendService = module.get(FileCopyAppendService);
		copyHelperService = module.get(CopyHelperService);
		authorization = module.get(AuthorizationService);
	});

	describe('copy course', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const allCourses = courseFactory.buildList(3, { teachers: [user] });
			const course = allCourses[0];
			const originalBoard = boardFactory.build({ course });
			const courseCopy = courseFactory.buildWithId({ teachers: [user] });
			const boardCopy = boardFactory.build({ course: courseCopy });

			authorization.getUserWithPermissions.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			authorization.checkPermission.mockReturnValue();
			roomsService.updateBoard.mockResolvedValue(originalBoard);

			const courseCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(courseCopyName);
			copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

			const boardCopyStatus = {
				title: 'boardCopy',
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: boardCopy,
			};
			boardCopyService.copyBoard.mockResolvedValue(boardCopyStatus);

			const status = {
				title: 'courseCopy',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: courseCopy,
			};

			courseEntityCopyService.copyCourse.mockReturnValue(status);

			return {
				user,
				course,
				originalBoard,
				courseCopy,
				boardCopy,
				status,
				courseCopyName,
				allCourses,
				boardCopyStatus,
			};
		};

		it('should fetch the user', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(authorization.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should fetch original course', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseRepo.findById).toBeCalledWith(course.id);
		});

		it('should fetch original board', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(boardRepo.findByCourseId).toBeCalledWith(course.id);
		});

		it('should persist course copy', async () => {
			const { course, courseCopy, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseRepo.save).toBeCalledWith(courseCopy);
		});

		it('should try to copy files copies from original task to task copy', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(fileCopyAppendService.copyFiles).toBeCalled();
		});

		it('should call board copy service', async () => {
			const { course, courseCopy, originalBoard, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(boardCopyService.copyBoard).toBeCalledWith({ originalBoard, destinationCourse: courseCopy, user });
		});

		it('should persist board copy', async () => {
			const { course, user, boardCopy } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(boardRepo.save).toBeCalledWith(boardCopy);
		});

		it('should return status', async () => {
			const { course, user, status } = setup();
			const result = await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(result).toEqual(status);
		});

		it('should ensure course has up to date board', async () => {
			const { course, user, originalBoard } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(roomsService.updateBoard).toHaveBeenCalledWith(originalBoard, course.id, user.id);
		});

		it('should use deriveCopyName from copyHelperService', async () => {
			const { course, user, allCourses } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			const allCourseNames = allCourses.map((c) => c.name);
			expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(course.name, allCourseNames);
		});

		it('should use deriveStatusFromElements from copyHelperService', async () => {
			const { course, user } = setup();
			const result = await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalledWith(result.elements);
		});

		it('should use lessonCopyService.updateCopiedEmbeddedTasks', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(lessonCopyService.updateCopiedEmbeddedTasks).toHaveBeenCalled();
		});

		it('should use findAllByUserId to determine existing course names', async () => {
			const { course, user } = setup();
			await service.copyCourse({ userId: user.id, courseId: course.id });
			expect(courseRepo.findAllByUserId).toHaveBeenCalledWith(user.id);
		});
	});
});
