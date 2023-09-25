import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FederalStateEntity } from '@shared/domain';
import { FederalStateRepo } from '@shared/repo';
import { federalStateFactory, setupEntities } from '@shared/testing';
import { FederalStateService } from './federal-state.service';

describe('FederalStateService', () => {
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

	describe('findFederalStateByName', () => {
		const setup = () => {
			const federalState: FederalStateEntity = federalStateFactory.build();
			federalStateRepo.findByName.mockResolvedValue(federalState);

			return {
				federalState,
			};
		};

		it('should return a federal state', async () => {
			const { federalState } = setup();

			const result: FederalStateEntity = await service.findFederalStateByName(federalState.name);

			expect(result).toBeDefined();
		});
	});
});
