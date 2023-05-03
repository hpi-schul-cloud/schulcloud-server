import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { boardFactory, courseFactory, setupEntities, userFactory } from '@shared/testing';
import { Action, AllowedAuthorizationEntityType } from '@src/modules/authorization';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { CopyElementType, CopyStatusEnum } from '@src/modules/copy-helper';
import { CourseCopyService } from '../service';
import { CourseCopyUC } from './course-copy.uc';

describe('course copy uc', () => {
	let module: TestingModule;
	let uc: CourseCopyUC;
	let authorization: DeepMocked<AuthorizationService>;
	let courseCopyService: DeepMocked<CourseCopyService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseCopyUC,
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
		authorization = module.get(AuthorizationService);
		courseCopyService = module.get(CourseCopyService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		Configuration.set('FEATURE_COPY_SERVICE_ENABLED', true);
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
			const status = {
				title: 'courseCopy',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: courseCopy,
			};

			courseCopyService.copyCourse.mockResolvedValue(status);

			return {
				user,
				course,
				originalBoard,
				courseCopy,
				boardCopy,
				allCourses,
				status,
			};
		};

		it('should throw if copy feature is deactivated', async () => {
			Configuration.set('FEATURE_COPY_SERVICE_ENABLED', false);
			const { course, user } = setup();
			await expect(uc.copyCourse(user.id, course.id)).rejects.toThrowError(InternalServerErrorException);
		});

		it('should check permission to create a course', async () => {
			const { course, user } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(authorization.checkAuthorizationByReferences).toBeCalledWith(
				user.id,
				AllowedAuthorizationEntityType.Course,
				course.id,
				{
					action: Action.write,
					requiredPermissions: [Permission.COURSE_CREATE],
				}
			);
		});

		it('should call course copy service', async () => {
			const { course, user } = setup();
			await uc.copyCourse(user.id, course.id);
			expect(courseCopyService.copyCourse).toBeCalledWith({ userId: user.id, courseId: course.id });
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
				authorization.checkAuthorizationByReferences.mockImplementation(() => {
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
