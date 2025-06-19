import { Logger } from '@core/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { InternalServerErrorException } from '@nestjs/common';
import { groupFactory } from '../testing';
import { DeleteUserGroupDataStep } from './delete-user-group-data.step';
import { GroupRepo } from '../repo';

describe(DeleteUserGroupDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserGroupDataStep;
	let groupRepo: DeepMocked<GroupRepo>;
	let logger: DeepMocked<Logger>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserGroupDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserGroupDataStep);
		groupRepo = module.get(GroupRepo);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserGroupDataStep(sagaService, createMock<GroupRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.GROUP, step);
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
				const group = groupFactory.build();
				const { userId } = group.users[0];

				const expectedResult = StepReportBuilder.build(ModuleName.GROUP, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 1, [group.id]),
				]);

				groupRepo.findGroupsByFilter.mockResolvedValue({ domainObjects: [group], total: 1 });

				return { expectedResult, group, userId };
			};

			it('should call groupRepo.findGroupsByFilter with userId', async () => {
				const { userId } = setup();
				await step.execute({ userId });

				expect(groupRepo.findGroupsByFilter).toHaveBeenCalledWith({ userId });
			});

			it('should call groupRepo.removeUserReference with userId', async () => {
				const { userId } = setup();
				await step.execute({ userId });

				expect(groupRepo.removeUserReference).toHaveBeenCalledWith(userId);
			});

			it('should retur nthe DomainDeletionReport', async () => {
				const { expectedResult, userId } = setup();
				const result = await step.execute({ userId });

				expect(result).toEqual(expectedResult);
			});

			it('should log the operation', async () => {
				const { userId } = setup();
				await step.execute({ userId });

				expect(logger.info).toHaveBeenCalledWith(expect.any(UserDeletionStepOperationLoggable));
			});
		});
	});
});
