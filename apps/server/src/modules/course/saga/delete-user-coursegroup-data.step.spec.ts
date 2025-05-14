import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseEntity, CourseGroupEntity, CourseGroupRepo } from '../repo';
import { courseGroupEntityFactory } from '../testing';
import { DeleteUserCourseGroupDataStep } from './delete-user-coursegroup-data.step';

describe(DeleteUserCourseGroupDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserCourseGroupDataStep;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let logger: DeepMocked<Logger>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserCourseGroupDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserCourseGroupDataStep);
		courseGroupRepo = module.get(CourseGroupRepo);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserCourseGroupDataStep(sagaService, createMock<CourseGroupRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.COURSE_COURSEGROUP, step);
		});
	});

	describe('execute', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const courseGroup1 = courseGroupEntityFactory.buildWithId({ students: [user] });
				const courseGroup2 = courseGroupEntityFactory.buildWithId({ students: [user] });

				courseGroupRepo.findByUserId.mockResolvedValue([[courseGroup1, courseGroup2], 2]);

				const expectedResult = StepReportBuilder.build(ModuleName.COURSE_COURSEGROUP, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [courseGroup1.id, courseGroup2.id]),
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should call courseGroupRepo.findByUserId', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(courseGroupRepo.findByUserId).toBeCalledWith(user.id);
			});

			it('should update courses without deleted user', async () => {
				const { expectedResult, user } = setup();

				const result = await step.execute({ userId: user.id });

				expect(result).toEqual(expectedResult);
			});
		});

		describe('deleteUserData', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const courseGroup1 = courseGroupEntityFactory.buildWithId({ students: [user] });
				const courseGroup2 = courseGroupEntityFactory.buildWithId({ students: [user] });

				courseGroupRepo.findByUserId.mockResolvedValue([[courseGroup1, courseGroup2], 2]);

				const expectedResult = StepReportBuilder.build(ModuleName.COURSE_COURSEGROUP, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [courseGroup1.id, courseGroup2.id]),
				]);

				return {
					expectedResult,
					user,
				};
			};

			it('should call courseGroupRepo.findByUserId', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(courseGroupRepo.findByUserId).toBeCalledWith(user.id);
			});

			it('should call repo.removeUserReference', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(courseGroupRepo.removeUserReference).toBeCalledWith(user.id);
			});

			it('should return DomainDeletionReport ', async () => {
				const { expectedResult, user } = setup();

				const result = await step.execute({ userId: user.id });

				expect(result).toEqual(expectedResult);
			});

			it('should log the deletion operation', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(logger.info).toHaveBeenCalledWith(expect.any(UserDeletionStepOperationLoggable));
			});
		});
	});
});
