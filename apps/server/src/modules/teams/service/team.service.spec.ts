import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsRepo } from '@shared/repo';
import { setupEntities, teamFactory, teamUserFactory, userDoFactory } from '@shared/testing';
import { EntityId, UserDO } from '@shared/domain';
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

	describe('deleteUserDataFromTeams', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });
				const userId = user.id as EntityId;

				return {
					userId,
				};
			};

			it('should throw an error', async () => {
				const { userId } = setup();

				await expect(service.deleteUserDataFromTeams(userId)).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when deleting by userId', () => {
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

				await service.deleteUserDataFromTeams(teamUser.user.id);

				expect(teamsRepo.findByUserId).toBeCalledWith(teamUser.user.id);
			});

			it('should update teams without deleted user', async () => {
				const { teamUser } = setup();

				const result = await service.deleteUserDataFromTeams(teamUser.user.id);

				expect(result).toEqual(2);
			});
		});
	});
});
