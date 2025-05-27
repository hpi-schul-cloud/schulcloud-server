import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUserClassDataStep } from './delete-user-class-data.step';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ClassesRepo } from '../repo';
import { Logger } from '@core/logger';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';
import { classEntityFactory } from '../entity/testing';
import { ClassMapper } from '../repo/mapper';

describe(DeleteUserClassDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserClassDataStep;
	let classesRepo: DeepMocked<ClassesRepo>;
	let logger: DeepMocked<Logger>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserClassDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: ClassesRepo,
					useValue: createMock<ClassesRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserClassDataStep);
		classesRepo = module.get(ClassesRepo);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserClassDataStep(sagaService, createMock<ClassesRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.CLASS, step);
		});
	});

	describe('execute', () => {
		describe('when user is missing', () => {
			it('should throw and error', async () => {
				// @ts-expect-error undefined check
				await expect(step.execute({ userId: undefined })).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when deleting by userId', () => {
			const setup = () => {
				const userId1 = new ObjectId();
				const userId2 = new ObjectId();
				const userId3 = new ObjectId();
				const class1 = classEntityFactory.withUserIds([userId1, userId2]).build();
				const class2 = classEntityFactory.withUserIds([userId1, userId3]).build();

				const mappedClasses = ClassMapper.mapToDOs([class1, class2]);

				classesRepo.findAllByUserId.mockResolvedValue(mappedClasses);

				const expectedResult = StepReportBuilder.build(ModuleName.CLASS, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [class1.id, class2.id]),
				]);

				return {
					expectedResult,
					userId1: userId1.toHexString(),
				};
			};

			it('should call classesRepo.findAllByUserId', async () => {
				const { userId1 } = setup();
				await step.execute({ userId: userId1 });

				expect(classesRepo.findAllByUserId).toBeCalledWith(userId1);
			});

			it('should call classesRepo.deleteUser', async () => {
				const { userId1 } = setup();
				await step.execute({ userId: userId1 });

				expect(classesRepo.removeUserReference).toBeCalledWith(userId1);
			});

			it('should return DomainDeletionReport', async () => {
				const { expectedResult, userId1 } = setup();

				const result = await step.execute({ userId: userId1 });

				expect(result).toEqual(expectedResult);
			});

			it('should log the deletion operation', async () => {
				const { userId1 } = setup();

				await step.execute({ userId: userId1 });

				expect(logger.info).toHaveBeenCalledWith(expect.any(UserDeletionStepOperationLoggable));
			});
		});
	});
});
