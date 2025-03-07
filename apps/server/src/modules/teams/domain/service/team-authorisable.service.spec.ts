import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { teamFactory } from '@modules/teams/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { TeamEntity, TeamsRepo } from '../../repo';
import { TeamAuthorisableService } from './team-authorisable.service';

describe('team authorisable service', () => {
	let module: TestingModule;
	let service: TeamAuthorisableService;
	let injectionService: AuthorizationInjectionService;

	let teamsRepo: DeepMocked<TeamsRepo>;

	beforeAll(async () => {
		await setupEntities([TeamEntity]);

		module = await Test.createTestingModule({
			providers: [
				TeamAuthorisableService,
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(TeamAuthorisableService);
		injectionService = module.get(AuthorizationInjectionService);
		teamsRepo = module.get(TeamsRepo);
	});

	it('should inject intself into authorisation', () => {
		expect(injectionService.getReferenceLoader(AuthorizableReferenceType.Team)).toEqual(service);
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
