import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
} from '@modules/saga';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamEntity, TeamRepo } from '../repo';
import { teamFactory, teamUserFactory } from '../testing';
import { DeleteUserTeamDataStep } from './delete-user-team-data.step';
import { setupEntities } from '@testing/database';

describe(DeleteUserTeamDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserTeamDataStep;
	let teamRepo: DeepMocked<TeamRepo>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([TeamEntity]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserTeamDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserTeamDataStep);
		teamRepo = module.get(TeamRepo);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserTeamDataStep(sagaService, createMock<TeamRepo>(), createMock<Logger>());

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.TEAM, step);
		});
	});

	describe('execute', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const teamUser = teamUserFactory.buildWithId();
				const team1 = teamFactory.withTeamUser([teamUser]).build();
				const team2 = teamFactory.withTeamUser([teamUser]).build();

				teamRepo.findByUserId.mockResolvedValue([team1, team2]);
				teamRepo.removeUserReferences.mockResolvedValue(2);

				const expectedResult = StepReportBuilder.build(ModuleName.TEAM, [
					StepOperationReportBuilder.build(StepOperationType.UPDATE, 2, [team1.id, team2.id]),
				]);

				return {
					expectedResult,
					teamUser,
				};
			};

			it('should call teamRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await step.execute({ userId: teamUser.user.id });

				expect(teamRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should call teamRepo.removeUserReferences', async () => {
				const { teamUser } = setup();

				await step.execute({ userId: teamUser.user.id });

				expect(teamRepo.removeUserReferences).toBeCalledWith(teamUser.user.id);
			});

			it('should return DomainDeletionReport', async () => {
				const { expectedResult, teamUser } = setup();

				const result = await step.execute({ userId: teamUser.user.id });

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
