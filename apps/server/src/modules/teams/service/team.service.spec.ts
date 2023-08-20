import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsRepo } from '@shared/repo';
import { setupEntities, teamFactory, teamUserFactory, userDoFactory } from '@shared/testing';
import { EntityId, TeamUserEntity, UserDO } from '@shared/domain';
import { TeamService } from './team.service';

describe('TeamsService', () => {
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

	describe('findByUserId', () => {
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

				await expect(service.findByUserId(userId)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('when searching by userId', () => {
		const setup = () => {
			// const user: UserDO = userDoFactory.buildWithId();
			// const userId = user.id as EntityId;

			const teamUser: TeamUserEntity = teamUserFactory.build();
			const team1 = teamFactory.withTeamUser([teamUser]).buildWithId();
			// const team2 = teamFactory.buildWithId();

			teamsRepo.findByUserId.mockResolvedValue([team1]);

			return {
				teamUser,
			};
		};

		it('should call teamsRepo.findByUserId', async () => {
			const { teamUser } = setup();

			await service.findByUserId(teamUser.userId.id);

			expect(teamsRepo.findByUserId).toHaveBeenCalledWith(teamUser.userId.id);
		});

		// 	it('should return an array of teams to which user belongs', async () => {
		// 		const { teamUser } = setup();

		// 		const result = await service.findByUserId(teamUser.userId.id);

		// 		expect(result.length).toEqual(1);
		// 	});
	});

	// describe('deleteByUserId', () => {
	// 	describe('when user is missing', () => {
	// 		const setup = () => {
	// 			const user: UserDO = userDoFactory.build({ id: undefined });

	// 			return {
	// 				user,
	// 			};
	// 		};

	// 		it('should throw an error', async () => {
	// 			const { user } = setup();

	// 			await expect(service.deleteUserDataFromTeams(user.id as string)).rejects.toThrowError(
	// 				InternalServerErrorException
	// 			);
	// 		});
	// 	});

	// 	// describe('when deleting by userId', () => {
	// 	// 	const setup = () => {
	// 	// 		const user: UserDO = userDoFactory.buildWithId();

	// 	// 		pseudonymRepo.deletePseudonymsByUserId.mockResolvedValue(2);
	// 	// 		externalToolPseudonymRepo.deletePseudonymsByUserId.mockResolvedValue(3);

	// 	// 		return {
	// 	// 			user,
	// 	// 		};
	// 	// 	};

	// 	// 	it('should delete pseudonyms by userId', async () => {
	// 	// 		const { user } = setup();

	// 	// 		const result5 = await service.deleteByUserId(user.id as string);

	// 	// 		expect(result5).toEqual(5);
	// 	// 	});
	// 	// });
	// });
});
