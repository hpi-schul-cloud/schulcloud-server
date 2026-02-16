import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationContextBuilder } from '@modules/authorization';
import { AuthorizationReferenceService } from '@modules/authorization-reference';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../learnroom.config';
import { CourseCopyService } from '../service';
import { CourseCopyUC } from './course-copy.uc';

describe('course copy uc', () => {
	let module: TestingModule;
	let uc: CourseCopyUC;
	let authorization: DeepMocked<AuthorizationReferenceService>;
	let courseCopyService: DeepMocked<CourseCopyService>;
	let config: LearnroomConfig;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);
		module = await Test.createTestingModule({
			providers: [
				CourseCopyUC,
				{
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
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
		authorization = module.get(AuthorizationReferenceService);
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

				await expect(uc.copyCourse(userId, courseId)).rejects.toThrowError(
					new InternalServerErrorException('Copy Feature not enabled')
				);
			});
		});

		describe('when authorization to course resolve with void and feature is activated', () => {
			const setup = () => {
				config.featureCopyServiceEnabled = true;
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ teachers: [user] });
				const courseCopy = courseEntityFactory.buildWithId({ teachers: [user] });

				const status = {
					title: 'courseCopy',
					type: CopyElementType.COURSE,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: courseCopy,
				};

				authorization.checkPermissionByReferences.mockResolvedValueOnce();
				courseCopyService.copyCourse.mockResolvedValueOnce(status);

				return {
					userId: user.id,
					courseId: course.id,
					status,
				};
			};

			it('should check permission to create a course', async () => {
				const { courseId, userId } = setup();

				await uc.copyCourse(userId, courseId);

				const context = AuthorizationContextBuilder.write([Permission.COURSE_CREATE]);
				expect(authorization.checkPermissionByReferences).toBeCalledWith(
					userId,
					AuthorizableReferenceType.Course,
					courseId,
					context
				);
			});

			it('should call course copy service', async () => {
				const { courseId, userId } = setup();

				await uc.copyCourse(userId, courseId);

				expect(courseCopyService.copyCourse).toBeCalledWith({ userId, courseId });
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
				const course = courseEntityFactory.buildWithId();
				authorization.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

				return { user, course };
			};

			it('should throw ForbiddenException', async () => {
				const { course, user } = setupWithCourseForbidden();

				await expect(uc.copyCourse(user.id, course.id)).rejects.toThrowError(new ForbiddenException());
			});
		});
	});
});
