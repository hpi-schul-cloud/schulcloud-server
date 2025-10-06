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
import { CourseEntity, CourseGroupEntity, CourseRepo } from '../repo';
import { courseEntityFactory } from '../testing';
import { DeleteUserCourseDataStep } from './delete-user-course-data.step';

describe(DeleteUserCourseDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserCourseDataStep;
	let courseRepo: DeepMocked<CourseRepo>;
	let logger: DeepMocked<Logger>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserCourseDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserCourseDataStep);
		courseRepo = module.get(CourseRepo);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserCourseDataStep(sagaService, createMock<CourseRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.COURSE, step);
		});
	});

	describe('execute', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course1 = courseEntityFactory.buildWithId({ students: [user] });
			const course2 = courseEntityFactory.buildWithId({ teachers: [user] });
			const course3 = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
			const allCourses = [course1, course2, course3];

			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);
			courseRepo.removeUserReference.mockResolvedValue([allCourses.map((c) => c.id), allCourses.length]);

			const expectedResult = StepReportBuilder.build(ModuleName.COURSE, [
				StepOperationReportBuilder.build(StepOperationType.UPDATE, 3, [course1.id, course2.id, course3.id]),
			]);

			return {
				expectedResult,
				user,
			};
		};

		it('should call repo.removeUserReference', async () => {
			const { user } = setup();
			await step.execute({ userId: user.id });
			expect(courseRepo.removeUserReference).toBeCalledWith(user.id);
		});

		it('should return DomainDeletionReport', async () => {
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
