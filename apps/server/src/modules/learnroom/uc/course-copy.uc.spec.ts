import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Actions, CopyElementType, CopyStatusEnum, CourseCopyService, Permission } from '@shared/domain';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import { boardFactory, courseFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { CourseCopyUC } from './course-copy.uc';

describe('course copy uc', () => {
	let orm: MikroORM;
	let uc: CourseCopyUC;
	let userRepo: DeepMocked<UserRepo>;
	let courseRepo: DeepMocked<CourseRepo>;
	let boardRepo: DeepMocked<BoardRepo>;
	let authorisation: DeepMocked<AuthorizationService>;
	let courseCopyService: DeepMocked<CourseCopyService>;

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
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
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
		boardRepo = module.get(BoardRepo);
	});

	describe('copy course', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const originalBoard = boardFactory.build({ course });

			authorisation.getUserWithPermissions.mockResolvedValue(user);
			courseRepo.findById.mockResolvedValue(course);
			boardRepo.findByCourseId.mockResolvedValue(originalBoard);
			authorisation.checkPermission.mockReturnValue();

			const copy = courseFactory.buildWithId({ teachers: [user] });
			const status = {
				title: 'courseCopy',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: copy,
			};
			courseCopyService.copyCourse.mockReturnValue(status);

			return { user, course, originalBoard, copy, status };
		};

		it('should fetch correct user', async () => {
			const { course, user } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(authorisation.getUserWithPermissions).toBeCalledWith(user.id);
		});

		it('should fetch original course', async () => {
			const { course, user } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(courseRepo.findById).toBeCalledWith(course.id);
		});

		it('should fetch original board', async () => {
			const { course, user } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(boardRepo.findByCourseId).toBeCalledWith(course.id);
		});

		it('should check authorisation for course', async () => {
			const { course, user } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(authorisation.checkPermission).toBeCalledWith(user, course, {
				action: Actions.write,
				requiredPermissions: [Permission.COURSE_CREATE],
			});
		});

		it('should call copy service', async () => {
			const { course, user, originalBoard } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(courseCopyService.copyCourse).toBeCalledWith({ originalCourse: course, originalBoard, user });
		});

		it('should persist copy', async () => {
			const { course, user, copy } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(courseRepo.save).toBeCalledWith(copy);
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
				userRepo.findById.mockResolvedValue(user);
				courseRepo.findById.mockResolvedValue(course);
				authorisation.checkPermission.mockImplementation(() => {
					throw new ForbiddenException();
				});
				return { user, course };
			};

			it('should throw ForbiddenException', async () => {
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
