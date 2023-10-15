import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FederalStateRepo } from '@shared/repo';
import { federalStateFactory, setupEntities } from '@shared/testing';
import { FederalStateMapper } from '../mapper/federal-state.mapper';
import { FederalStateService } from './federal-state.service';

describe(FederalStateService.name, () => {
	let module: TestingModule;
	let service: FederalStateService;
	let federalStateRepo: DeepMocked<FederalStateRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FederalStateService,
				{
					provide: FederalStateRepo,
					useValue: createMock<FederalStateRepo>(),
				},
			],
		}).compile();

		service = module.get(FederalStateService);
		federalStateRepo = module.get(FederalStateRepo);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findAll', () => {
		const setup = () => {
			const federalStateEntities = federalStateFactory.buildList(5);
			federalStateRepo.findAll.mockResolvedValue(federalStateEntities);

			return { federalStateEntities };
		};

		it('should return do objects', async () => {
			const { federalStateEntities } = setup();

			const federalStateDos = await service.findAll();
			const toExpect = federalStateEntities.map((e) => FederalStateMapper.mapFederalStateEntityToDO(e));

			expect(federalStateDos.length).toEqual(federalStateEntities.length);
			expect(federalStateDos).toEqual(toExpect);
		});
	});

	// describe('create', () => {});

	// describe('delete', () => {});
});
