import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { teamFactory } from '@modules/team/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { TeamEntity, TeamRepo } from '../../repo';
import { TeamAuthorisableService } from './team-authorisable.service';

describe('team authorisable service', () => {
	let module: TestingModule;
	let service: TeamAuthorisableService;
	let injectionService: AuthorizationInjectionService;

	let teamRepo: DeepMocked<TeamRepo>;

	beforeAll(async () => {
		await setupEntities([TeamEntity]);

		module = await Test.createTestingModule({
			providers: [
				TeamAuthorisableService,
				{
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
				},
				AuthorizationInjectionService,
			],
		}).compile();

		service = module.get(TeamAuthorisableService);
		injectionService = module.get(AuthorizationInjectionService);
		teamRepo = module.get(TeamRepo);
	});

	it('should inject intself into authorisation', () => {
		expect(injectionService.getReferenceLoader(AuthorizableReferenceType.Team)).toEqual(service);
	});

	it('should return entity', async () => {
		const team = teamFactory.buildWithId();
		teamRepo.findById.mockResolvedValue(team);

		const result = await service.findById(team.id);
		expect(result).toEqual(team);
	});

	it('should call repo with populate', async () => {
		const team = teamFactory.buildWithId();
		teamRepo.findById.mockResolvedValue(team);

		await service.findById(team.id);
		expect(teamRepo.findById).toHaveBeenCalledWith(team.id, true);
	});
});
