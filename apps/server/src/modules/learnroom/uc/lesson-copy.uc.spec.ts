import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Action, AuthorizableObject, User } from '@shared/domain';
import { Permission } from '@shared/domain/interface/permission.enum';
import { CourseRepo, LessonRepo, UserRepo } from '@shared/repo';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@src/modules/copy-helper';
import { EtherpadService, LessonCopyService } from '@src/modules/lesson/service';
import { LessonCopyUC } from './lesson-copy.uc';

describe('lesson copy uc', () => {
	let module: TestingModule;
	let uc: LessonCopyUC;
	let userRepo: DeepMocked<UserRepo>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let authorisation: DeepMocked<AuthorizationService>;
	let lessonCopyService: DeepMocked<LessonCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				LessonCopyUC,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LessonCopyService,
					useValue: createMock<LessonCopyService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: EtherpadService,
					useValue: createMock<EtherpadService>(),
				},
			],
		}).compile();

		uc = module.get(LessonCopyUC);
		userRepo = module.get(UserRepo);
		lessonRepo = module.get(LessonRepo);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
	});

	beforeEach(() => {
		Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
		jest.resetAllMocks();
	});

	describe('copy lesson', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const allLessons = lessonFactory.buildList(3, { course });
			const lesson = allLessons[0];

			authorisation.getUserWithPermissions.mockResolvedValue(user);
			lessonRepo.findById.mockResolvedValue(lesson);
			lessonRepo.findAllByCourseIds.mockResolvedValue([allLessons, allLessons.length]);
			lessonRepo.save.mockResolvedValue(undefined);

			courseRepo.findById.mockResolvedValue(course);
			authorisation.hasPermission.mockReturnValue(true);
			const copy = lessonFactory.buildWithId({ course });
			const status = {
				title: 'lessonCopy',
				type: CopyElementType.LESSON,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: copy,
			};
			lessonCopyService.copyLesson.mockResolvedValue(status);
			lessonCopyService.updateCopiedEmbeddedTasks.mockReturnValue(status);
			const lessonCopyName = 'Copy';
			copyHelperService.deriveCopyName.mockReturnValue(lessonCopyName);

			return {
				user,
				course,
				lesson,
				copy,
				status,
				lessonCopyName,
				allLessons,
				userId: user.id,
			};
		};

		it('should throw if copy feature is deactivated', async () => {
			Configuration.set('FEATURE_COPY_SERVICE_ENABLED', false);
			const { course, user, lesson, userId } = setup();
			await expect(uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId })).rejects.toThrowError(
				InternalServerErrorException
			);
		});

		it('should fetch correct user', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(authorisation.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should fetch correct lesson', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(lessonRepo.findById).toBeCalledWith(lesson.id);
		});

		it('should fetch destination course', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(courseRepo.findById).toBeCalledWith(course.id);
		});

		it('should pass without destination course', async () => {
			const { user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { userId });
			expect(courseRepo.findById).not.toHaveBeenCalled();
		});

		it('should check authorisation for lesson', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(authorisation.hasPermission).toBeCalledWith(user, lesson, {
				action: Action.read,
				requiredPermissions: [Permission.TOPIC_CREATE],
			});
		});

		it('should check authorisation for destination course', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(authorisation.checkPermissionByReferences).toBeCalledWith(
				user.id,
				AllowedAuthorizationEntityType.Course,
				course.id,
				{
					action: Action.write,
					requiredPermissions: [],
				}
			);
		});

		it('should pass authorisation check without destination course', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { userId });
			expect(authorisation.hasPermission).not.toBeCalledWith(user, course, {
				action: Action.write,
				requiredPermissions: [],
			});
		});

		it('should call copy service', async () => {
			const { course, user, lesson, lessonCopyName, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(lessonCopyService.copyLesson).toBeCalledWith({
				originalLessonId: lesson.id,
				destinationCourse: course,
				user,
				copyName: lessonCopyName,
			});
		});

		it('should return status', async () => {
			const { course, user, lesson, status, userId } = setup();
			const result = await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(result).toEqual(status);
		});

		it('should use copyHelperService', async () => {
			const { course, user, lesson, allLessons, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			const existingNames = allLessons.map((l) => l.name);
			expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(lesson.name, existingNames);
		});

		it('should use findAllByCourseIds to determine existing lesson names', async () => {
			const { course, user, lesson, userId } = setup();
			await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId });
			expect(lessonRepo.findAllByCourseIds).toHaveBeenCalledWith([course.id]);
		});

		describe('when access to lesson is forbidden', () => {
			const setupWithLessonForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();
				userRepo.findById.mockResolvedValue(user);
				lessonRepo.findById.mockResolvedValue(lesson);
				authorisation.hasPermission.mockImplementation((u: User, e: AuthorizableObject) => e !== lesson);

				return { user, course, lesson };
			};

			it('should throw NotFoundException', async () => {
				const { course, user, lesson } = setupWithLessonForbidden();

				try {
					await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId: new ObjectId().toHexString() });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});

		describe('when access to course is forbidden', () => {
			const setupWithCourseForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();
				userRepo.findById.mockResolvedValue(user);
				lessonRepo.findById.mockResolvedValue(lesson);
				courseRepo.findById.mockResolvedValue(course);
				authorisation.hasPermission.mockReturnValue(true);
				authorisation.checkPermissionByReferences.mockImplementation(() => {
					throw new ForbiddenException();
				});

				return { user, course, lesson };
			};

			it('should throw Forbidden Exception', async () => {
				const { course, user, lesson } = setupWithCourseForbidden();

				try {
					await uc.copyLesson(user.id, lesson.id, { courseId: course.id, userId: new ObjectId().toHexString() });
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});
	});
});
