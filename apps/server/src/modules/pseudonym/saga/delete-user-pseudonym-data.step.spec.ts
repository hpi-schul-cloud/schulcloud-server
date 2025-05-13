import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { userDoFactory } from '@modules/user/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { ExternalToolPseudonymRepo } from '../repo';
import { DeleteUserPseudonymDataStep } from './delete-user-pseudonym-data.step';

describe(DeleteUserPseudonymDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserPseudonymDataStep;
	let externalToolPseudonymRepo: DeepMocked<ExternalToolPseudonymRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserPseudonymDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: ExternalToolPseudonymRepo,
					useValue: createMock<ExternalToolPseudonymRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserPseudonymDataStep);
		externalToolPseudonymRepo = module.get(ExternalToolPseudonymRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserPseudonymDataStep(
				sagaService,
				createMock<ExternalToolPseudonymRepo>(),
				createMock<Logger>()
			);

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.PSEUDONYM, step);
		});
	});

	describe('execute', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user = userDoFactory.build({ id: undefined });

				return {
					user,
				};
			};

			it('should throw an error', async () => {
				const { user } = setup();

				await expect(step.execute({ userId: user.id as EntityId })).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when deleting by userId', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const pseudonymsDeleted = [new ObjectId().toHexString(), new ObjectId().toHexString()];

				const expectedResult = StepReportBuilder.build(ModuleName.PSEUDONYM, [
					StepOperationReportBuilder.build(StepOperationType.DELETE, pseudonymsDeleted.length, [...pseudonymsDeleted]),
				]);

				externalToolPseudonymRepo.deletePseudonymsByUserId.mockResolvedValue(pseudonymsDeleted);

				return {
					expectedResult,
					user,
				};
			};

			it('should delete pseudonyms by userId', async () => {
				const { expectedResult, user } = setup();

				const result = await step.execute({ userId: user.id as EntityId });

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
