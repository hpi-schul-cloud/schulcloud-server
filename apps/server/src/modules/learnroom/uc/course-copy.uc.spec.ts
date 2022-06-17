import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CourseCopyService } from '@shared/domain/service/course-copy.service';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Actions, Permission } from '../../../shared/domain';
import { CourseRepo, UserRepo } from '../../../shared/repo';
import { courseFactory, setupEntities, userFactory } from '../../../shared/testing';
import { CourseCopyUC } from './course-copy.uc';

describe('course copy uc', () => {
	let orm: MikroORM;
	let uc: CourseCopyUC;
	let userRepo: UserRepo;
	let courseRepo: CourseRepo;
	let authorisation: AuthorizationService;
	let courseCopyService: CourseCopyService;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				CourseCopyUC,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
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
					provide: CourseCopyService,
					useValue: createMock<CourseCopyService>(),
				},
			],
		}).compile();

		uc = module.get(CourseCopyUC);
		userRepo = module.get(UserRepo);
		authorisation = module.get(AuthorizationService);
		courseRepo = module.get(CourseRepo);
		courseCopyService = module.get(CourseCopyService);
	});

	describe('copy course', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const userSpy = jest
				.spyOn(authorisation, 'getUserWithPermissions')
				.mockImplementation(() => Promise.resolve(user));
			const courseSpy = jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
			const authSpy = jest.spyOn(authorisation, 'hasPermission').mockImplementation(() => true);
			const copy = courseFactory.buildWithId({ teachers: [user] });
			const status = {
				title: 'courseCopy',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
			};
			const courseCopySpy = jest
				.spyOn(courseCopyService, 'copyCourseMetadata')
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				.mockImplementation(() => ({
					copy,
					status,
				}));
			const coursePersistSpy = jest.spyOn(courseRepo, 'save');
			return { user, course, userSpy, courseSpy, authSpy, copy, status, courseCopySpy, coursePersistSpy };
		};

		it('should fetch correct user', async () => {
			const { course, user, userSpy } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(userSpy).toBeCalledWith(user.id);
		});

		it('should fetch original course', async () => {
			const { course, user, courseSpy } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(courseSpy).toBeCalledWith(course.id);
		});

		it('should check authorisation for course', async () => {
			const { course, user, authSpy } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(authSpy).toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [Permission.COURSE_CREATE],
			});
		});

		it('should call copy service', async () => {
			const { course, user, courseCopySpy } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(courseCopySpy).toBeCalledWith({ originalCourse: course, user });
		});

		it('should persist copy', async () => {
			const { course, user, coursePersistSpy, copy } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(coursePersistSpy).toBeCalledWith(copy);
		});

		it('should return status', async () => {
			const { course, user, status } = setup();
			const result = await uc.copyCourse(user.id, course.id);
			expect(result).toEqual(status);
		});

		describe('when access to course is forbidden', () => {
			const setupWithCourseForbidden = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));
				jest.spyOn(courseRepo, 'findById').mockImplementation(() => Promise.resolve(course));
				jest.spyOn(authorisation, 'hasPermission').mockImplementation(() => false);
				return { user, course };
			};

			it('should throw NotFoundException', async () => {
				const { course, user } = setupWithCourseForbidden();

				try {
					await uc.copyCourse(user.id, course.id);
					throw new Error('should have failed');
				} catch (err) {
					expect(err).toBeInstanceOf(ForbiddenException);
				}
			});
		});
	});
});
