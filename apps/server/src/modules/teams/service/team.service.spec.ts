import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsRepo } from '@shared/repo';
import { setupEntities, teamFactory, teamUserFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DomainName, OperationType } from '@shared/domain/types';
import { TeamService } from './team.service';

describe('TeamService', () => {
	let module: TestingModule;
	let service: TeamService;

	let teamsRepo: DeepMocked<TeamsRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TeamService,
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(TeamService);
		teamsRepo = module.get(TeamsRepo);

		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findUserDataFromTeams', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const teamUser = teamUserFactory.buildWithId();
				const team1 = teamFactory.withTeamUser([teamUser]).build();
				const team2 = teamFactory.withTeamUser([teamUser]).build();

				teamsRepo.findByUserId.mockResolvedValue([team1, team2]);

				return {
					teamUser,
				};
			};

			it('should call teamsRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await service.findUserDataFromTeams(teamUser.user.id);

				expect(teamsRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should return array of two teams with user', async () => {
				const { teamUser } = setup();

				const result = await service.findUserDataFromTeams(teamUser.user.id);

				expect(result.length).toEqual(2);
			});
		});
	});

	describe('deleteUserDataFromTeams', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const teamUser = teamUserFactory.buildWithId();
				const team1 = teamFactory.withTeamUser([teamUser]).build();
				const team2 = teamFactory.withTeamUser([teamUser]).build();

				teamsRepo.findByUserId.mockResolvedValue([team1, team2]);

				const expectedResult = DomainOperationBuilder.build(DomainName.TEAMS, OperationType.UPDATE, 2, [
					team1.id,
					team2.id,
				]);

				return {
					expectedResult,
					teamUser,
				};
			};

			it('should call teamsRepo.findByUserId', async () => {
				const { teamUser } = setup();

				await service.deleteUserDataFromTeams(teamUser.user.id);

				expect(teamsRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should update teams without deleted user', async () => {
				const { expectedResult, teamUser } = setup();

				const result = await service.deleteUserDataFromTeams(teamUser.user.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
