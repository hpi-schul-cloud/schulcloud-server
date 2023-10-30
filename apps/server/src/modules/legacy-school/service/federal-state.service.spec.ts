import { Test, TestingModule } from '@nestjs/testing';

import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FederalStateEntity } from '@shared/domain/entity/federal-state.entity';
import { FederalStateRepo } from '@shared/repo/federalstate/federal-state.repo';
import { federalStateFactory } from '@shared/testing/factory/federal-state.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { FederalStateNames } from '../types/federal-state-names.enum';
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
			const federalState: FederalStateEntity = federalStateFactory.build({ name: FederalStateNames.NIEDERSACHEN });
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
