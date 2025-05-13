import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { Submission, Task } from '@modules/task/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ComponentProperties, ComponentType, LessonEntity, LessonRepo, Material } from '../repo';
import { lessonFactory } from '../testing';
import { DeleteUserLessonDataStep } from './delete-user-lesson-data.step';

describe(DeleteUserLessonDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserLessonDataStep;
	let lessonRepo: DeepMocked<LessonRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserLessonDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserLessonDataStep);
		lessonRepo = module.get(LessonRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserLessonDataStep(sagaService, createMock<LessonRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.LESSON, step);
		});
	});

	describe('execute', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const userId = new ObjectId();
				const contentExample: ComponentProperties = {
					title: 'title',
					hidden: false,
					user: userId,
					component: ComponentType.TEXT,
					content: { text: 'test of content' },
				};
				const lesson1 = lessonFactory.buildWithId({ contents: [contentExample] });
				const lesson2 = lessonFactory.buildWithId({ contents: [contentExample] });

				lessonRepo.findByUserId.mockResolvedValue([lesson1, lesson2]);
				lessonRepo.removeUserReference.mockResolvedValue(2);

				const expectedResult = StepReportBuilder.build(ModuleName.LESSON, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [lesson1.id, lesson2.id]),
				]);

				return {
					expectedResult,
					userId,
				};
			};

			it('should call lessonRepo.findByUserId', async () => {
				const { userId } = setup();

				await step.execute({ userId: userId.toHexString() });

				expect(lessonRepo.findByUserId).toBeCalledWith(userId.toHexString());
			});

			it('should call lessonRepo.removeUserReference', async () => {
				const { userId } = setup();

				await step.execute({ userId: userId.toHexString() });

				expect(lessonRepo.removeUserReference).toBeCalledWith(userId.toHexString());
			});

			it('should update lessons without deleted user', async () => {
				const { expectedResult, userId } = setup();

				const result = await step.execute({ userId: userId.toHexString() });

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
