import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationContextBuilder } from '@modules/authorization';
import { AuthorizableReferenceType, AuthorizationReferenceService } from '@modules/authorization/domain';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseCopyService } from '../service';
import { CourseCopyUC } from './course-copy.uc';

describe('course copy uc', () => {
	let module: TestingModule;
	let uc: CourseCopyUC;
	let authorization: DeepMocked<AuthorizationReferenceService>;
	let courseCopyService: DeepMocked<CourseCopyService>;

	beforeAll(async () => {
		await setupEntities();
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
			],
		}).compile();

		uc = module.get(CourseCopyUC);
		authorization = module.get(AuthorizationReferenceService);
		courseCopyService = module.get(CourseCopyService);
	});

	afterAll(async () => {
		await module.close();
	});

	// Please be careful the Configuration.set is effects all tests !!!

	describe('copy course', () => {
		describe('when authorization to course resolve with void and feature is deactivated', () => {
			const setup = () => {
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', false);
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });

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
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });
				const courseCopy = courseFactory.buildWithId({ teachers: [user] });

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
				Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
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
