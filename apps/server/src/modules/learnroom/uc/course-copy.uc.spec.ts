import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { CourseDoService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseFactory } from '@modules/course/testing';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { LEARNROOM_CONFIG_TOKEN, type LearnroomConfig } from '../learnroom.config';
import { CourseCopyService } from '../service';
import { CourseCopyUC } from './course-copy.uc';

describe('course copy uc', () => {
	let module: TestingModule;
	let uc: CourseCopyUC;
	let authorizationService: DeepMocked<AuthorizationService>;
	let courseDoService: DeepMocked<CourseDoService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let config: LearnroomConfig;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity, UserLoginMigrationEntity]);
		module = await Test.createTestingModule({
			providers: [
				CourseCopyUC,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseDoService,
					useValue: createMock<CourseDoService>(),
				},
				{
					provide: CourseCopyService,
					useValue: createMock<CourseCopyService>(),
				},
				{
					provide: LEARNROOM_CONFIG_TOKEN,
					useValue: {},
				},
			],
		}).compile();

		uc = module.get(CourseCopyUC);
		authorizationService = module.get(AuthorizationService);
		courseDoService = module.get(CourseDoService);
		courseCopyService = module.get(CourseCopyService);
		config = module.get<LearnroomConfig>(LEARNROOM_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	// Please be careful the Configuration.set is effects all tests !!!

	describe('copy course', () => {
		describe('when authorization to course resolve with void and feature is deactivated', () => {
			const setup = () => {
				config.featureCopyServiceEnabled = false;
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ teachers: [user] });

				return {
					userId: user.id,
					courseId: course.id,
				};
			};

			it('should throw if copy feature is deactivated', async () => {
				const { courseId, userId } = setup();

				await expect(uc.copyCourse(userId, courseId)).rejects.toThrow(
					new InternalServerErrorException('Copy Feature not enabled')
				);
			});
		});

		describe('when authorization to course resolve with void and feature is activated', () => {
			const setup = () => {
				config.featureCopyServiceEnabled = true;
				const user = userFactory.buildWithId();
				const course = courseFactory.build();
				const courseCopy = courseEntityFactory.buildWithId();

				const status = {
					title: 'courseCopy',
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: courseCopy,
				};

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseDoService.findById.mockResolvedValueOnce(course);
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				return {
					userId: user.id,
					courseId: course.id,
					user,
					course,
					status,
				};
			};

			it('should check permission to create a course', async () => {
				const { courseId, userId, user, course } = setup();

				await uc.copyCourse(userId, courseId);

				const context = AuthorizationContextBuilder.write([Permission.COURSE_CREATE]);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, course, context);
			});

			it('should call course copy service', async () => {
				const { courseId, userId } = setup();

				await uc.copyCourse(userId, courseId);

				expect(courseCopyService.copyCourse).toHaveBeenCalledWith({ userId, courseId });
			});

			it('should return status', async () => {
				const { courseId, userId, status } = setup();

				const result = await uc.copyCourse(userId, courseId);

				expect(result).toEqual(status);
			});
		});

		describe('when authorization to course throw a forbidden exception', () => {
			const setupWithCourseForbidden = () => {
				config.featureCopyServiceEnabled = true;
				const user = userFactory.buildWithId();
				const course = courseFactory.build();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseDoService.findById.mockResolvedValueOnce(course);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				return { user, course };
			};

			it('should throw ForbiddenException', async () => {
				const { course, user } = setupWithCourseForbidden();

				await expect(uc.copyCourse(user.id, course.id)).rejects.toThrow(new ForbiddenException());
			});
		});

		describe('when courseDoService.findById throws', () => {
			const setup = () => {
				config.featureCopyServiceEnabled = true;
				const user = userFactory.buildWithId();
				const course = courseFactory.build();
				const error = new Error('course not found');
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseDoService.findById.mockRejectedValueOnce(error);

				return { userId: user.id, courseId: course.id, error };
			};

			it('should propagate the error', async () => {
				const { userId, courseId, error } = setup();

				await expect(uc.copyCourse(userId, courseId)).rejects.toThrow(error);
			});
		});

		describe('when authorizationService.getUserWithPermissions throws', () => {
			const setup = () => {
				config.featureCopyServiceEnabled = true;
				const user = userFactory.buildWithId();
				const course = courseFactory.build();
				const error = new Error('user not found');
				authorizationService.getUserWithPermissions.mockRejectedValueOnce(error);
				courseDoService.findById.mockResolvedValueOnce(course);

				return { userId: user.id, courseId: course.id, error };
			};

			it('should propagate the error', async () => {
				const { userId, courseId, error } = setup();

				await expect(uc.copyCourse(userId, courseId)).rejects.toThrow(error);
			});
		});
	});
});
