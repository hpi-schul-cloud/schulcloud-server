import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TeamsRepo } from '@shared/repo';
import { setupEntities, teamFactory } from '@shared/testing';
import { TeamAuthorisableService } from './team-authorisable.service';

describe('team authorisable service', () => {
	let module: TestingModule;
	let service: TeamAuthorisableService;

	let teamsRepo: DeepMocked<TeamsRepo>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				TeamAuthorisableService,
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
			],
		}).compile();

		service = module.get(TeamAuthorisableService);
		teamsRepo = module.get(TeamsRepo);
	});

	it('should return entity', async () => {
		const team = teamFactory.buildWithId();
		teamsRepo.findById.mockResolvedValue(team);

		const result = await service.findById(team.id);
		expect(result).toEqual(team);
	});

	it('should call repo with populate', async () => {
		const team = teamFactory.buildWithId();
		teamsRepo.findById.mockResolvedValue(team);

		await service.findById(team.id);
		expect(teamsRepo.findById).toHaveBeenCalledWith(team.id, true);
	});
});
