import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CopyElementType, CopyHelperService, CopyStatusEnum } from '@modules/copy-helper';
import { LessonCopyService, LessonService } from '@modules/lesson';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { CourseRepo, UserRepo } from '@shared/repo';
import { courseFactory, lessonFactory, setupEntities, userFactory } from '@shared/testing';
import { LessonCopyUC } from './lesson-copy.uc';

describe('lesson copy uc', () => {
	let module: TestingModule;
	let uc: LessonCopyUC;
	let userRepo: DeepMocked<UserRepo>;
	let lessonService: DeepMocked<LessonService>;
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
					provide: LessonService,
					useValue: createMock<LessonService>(),
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
			],
		}).compile();

		uc = module.get(LessonCopyUC);
		userRepo = module.get(UserRepo);
		lessonService = module.get(LessonService);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonCopyService = module.get(LessonCopyService);
		copyHelperService = module.get(CopyHelperService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	// Please be careful the Configuration.set is effects all tests !!!

	describe('copy lesson', () => {
		// missing tests
		// when course repo is throw a error
		// when lesson repo is throw a error
		describe('when feature flag is disabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', false);

				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });
				const lesson = lessonFactory.build({ course });

				const parentParams = { courseId: course.id, userId: user.id };

				return {
					userId: user.id,
					lessonId: lesson.id,
					parentParams,
				};
			};

			it('should throw if copy feature is deactivated', async () => {
				const { userId, lessonId, parentParams } = setup();

				await expect(uc.copyLesson(userId, lessonId, parentParams)).rejects.toThrowError(
					new InternalServerErrorException('Copy Feature not enabled')
				);
			});
		});

		describe('when authorization resolve and no destination course is passed', () => {
			const setup = () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);

				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });
				const allLessons = lessonFactory.buildList(3, { course });
				const copy = lessonFactory.buildWithId({ course });

				const lesson = allLessons[0];
				const status = {
					title: 'lessonCopy',
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: copy,
				};
				const lessonCopyName = 'Copy';
				const parentParams = { userId: user.id };

				authorisation.getUserWithPermissions.mockResolvedValueOnce(user);
				authorisation.hasPermission.mockReturnValue(true);

				lessonService.findById.mockResolvedValueOnce(lesson);
				lessonService.findByCourseIds.mockResolvedValueOnce([allLessons, allLessons.length]);
				courseRepo.findById.mockResolvedValueOnce(course);

				lessonCopyService.copyLesson.mockResolvedValueOnce(status);
				copyHelperService.deriveCopyName.mockReturnValueOnce(lessonCopyName);

				return {
					user,
					userId: user.id,
					course,
					courseId: course.id,
					lessonId: lesson.id,
					parentParams,
				};
			};

			it('should pass without destination course', async () => {
				const { lessonId, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				expect(courseRepo.findById).not.toHaveBeenCalled();
			});

			it('should pass authorisation check without destination course', async () => {
				const { course, user, lessonId, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				const context = AuthorizationContextBuilder.write([]);
				expect(authorisation.hasPermission).not.toBeCalledWith(user, course, context);
			});
		});

		describe('when authorization resolve', () => {
			const setup = () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);

				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });
				const allLessons = lessonFactory.buildList(3, { course });
				const copy = lessonFactory.buildWithId({ course });

				const lesson = allLessons[0];
				const status = {
					title: 'lessonCopy',
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: copy,
				};
				const lessonCopyName = 'Copy';
				const parentParams = { courseId: course.id, userId: user.id };

				authorisation.getUserWithPermissions.mockResolvedValueOnce(user);
				authorisation.hasPermission.mockReturnValue(true);

				lessonService.findById.mockResolvedValueOnce(lesson);
				lessonService.findByCourseIds.mockResolvedValueOnce([allLessons, allLessons.length]);
				courseRepo.findById.mockResolvedValueOnce(course);

				lessonCopyService.copyLesson.mockResolvedValueOnce(status);
				// lessonCopyService.updateCopiedEmbeddedTasks.mockReturnValue(status);
				copyHelperService.deriveCopyName.mockReturnValueOnce(lessonCopyName);

				return {
					user,
					userId: user.id,
					course,
					courseId: course.id,
					lesson,
					lessonId: lesson.id,
					parentParams,
					copy,
					status,
					lessonCopyName,
					allLessons,
				};
			};

			it('should fetch correct user', async () => {
				const { lessonId, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				expect(authorisation.getUserWithPermissions).toBeCalledWith(userId);
			});

			it('should fetch correct lesson', async () => {
				const { lessonId, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				expect(lessonService.findById).toBeCalledWith(lessonId);
			});

			it('should fetch destination course', async () => {
				const { course, lessonId, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				expect(courseRepo.findById).toBeCalledWith(course.id);
			});

			it('should check authorisation for lesson', async () => {
				const { lessonId, userId, user, lesson, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				const context = AuthorizationContextBuilder.read([Permission.TOPIC_CREATE]);
				expect(authorisation.hasPermission).toBeCalledWith(user, lesson, context);
			});

			it('should check authorisation for destination course', async () => {
				const { course, user, lessonId, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				const context = AuthorizationContextBuilder.write([]);
				expect(authorisation.checkPermission).toBeCalledWith(user, course, context);
			});

			it('should call copy service', async () => {
				const { course, user, lessonId, lessonCopyName, userId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				expect(lessonCopyService.copyLesson).toBeCalledWith({
					originalLessonId: lessonId,
					destinationCourse: course,
					user,
					copyName: lessonCopyName,
				});
			});

			it('should return status', async () => {
				const { lessonId, status, userId, parentParams } = setup();

				const result = await uc.copyLesson(userId, lessonId, parentParams);

				expect(result).toEqual(status);
			});

			it('should use copyHelperService', async () => {
				const { lessonId, allLessons, userId, lesson, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				const existingNames = allLessons.map((l) => l.name);
				expect(copyHelperService.deriveCopyName).toHaveBeenCalledWith(lesson.name, existingNames);
			});

			it('should use findAllByCourseIds to determine existing lesson names', async () => {
				const { courseId, userId, lessonId, parentParams } = setup();

				await uc.copyLesson(userId, lessonId, parentParams);

				expect(lessonService.findByCourseIds).toHaveBeenCalledWith([courseId]);
			});
		});

		describe('when authorization of lesson throw forbidden exception', () => {
			const setup = () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);

				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();

				const parentParams = { courseId: course.id, userId: new ObjectId().toHexString() };

				userRepo.findById.mockResolvedValueOnce(user);
				lessonService.findById.mockResolvedValueOnce(lesson);
				courseRepo.findById.mockResolvedValueOnce(course);
				authorisation.hasPermission.mockReturnValueOnce(false);

				return {
					userId: user.id,
					lessonId: lesson.id,
					parentParams,
				};
			};

			it('should throw ForbiddenException', async () => {
				const { parentParams, userId, lessonId } = setup();

				await expect(uc.copyLesson(userId, lessonId, parentParams)).rejects.toThrowError(
					new ForbiddenException('could not find lesson to copy')
				);
			});
		});

		describe('when authorization of course throw with forbidden exception', () => {
			const setup = () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);

				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId();

				const parentParams = { courseId: course.id, userId: new ObjectId().toHexString() };

				userRepo.findById.mockResolvedValueOnce(user);
				lessonService.findById.mockResolvedValueOnce(lesson);
				courseRepo.findById.mockResolvedValueOnce(course);
				authorisation.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				authorisation.hasPermission.mockReturnValueOnce(true);

				return {
					userId: user.id,
					lessonId: lesson.id,
					parentParams,
				};
			};

			it('should pass the forbidden exception', async () => {
				const { parentParams, userId, lessonId } = setup();

				await expect(uc.copyLesson(userId, lessonId, parentParams)).rejects.toThrowError(new ForbiddenException());
			});
		});
	});
});
