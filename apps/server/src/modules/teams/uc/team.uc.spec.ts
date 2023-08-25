import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, teamUserFactory } from '@shared/testing';
import { TeamService } from '../service';
import { TeamUC } from './team.uc';

describe('TeamUC', () => {
	let teamUC: TeamUC;
	let module: TestingModule;

	let teamService: DeepMocked<TeamService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TeamUC,
				{
					provide: TeamService,
					useValue: createMock<TeamService>(),
				},
			],
		}).compile();
		teamUC = module.get(TeamUC);
		teamService = module.get(TeamService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(teamUC).toBeDefined();
	});

	it('should call teamService.deleteUserDataFromTeams', async () => {
		const teamUser = teamUserFactory.build();

		await teamUC.deleteUserData(teamUser.user.id);

		expect(teamService.deleteUserDataFromTeams).toBeCalledWith(teamUser.user.id);
	});

	it('should update teams without deleted user', async () => {
		const teamUser = teamUserFactory.build();

		teamService.deleteUserDataFromTeams.mockResolvedValue(3);

		const result = await teamUC.deleteUserData(teamUser.user.id);

		expect(result).toEqual(3);
	});
});
