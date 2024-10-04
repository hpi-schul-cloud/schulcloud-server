import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TeamsRepo } from '@shared/repo';
import { setupEntities, teamFactory } from '@shared/testing';
import { TeamAuthorisableService } from './team-authorisable.service';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@src/modules/authorization';

describe('team authorisable service', () => {
	let module: TestingModule;
	let service: TeamAuthorisableService;
	let injectionService: AuthorizationInjectionService;

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
