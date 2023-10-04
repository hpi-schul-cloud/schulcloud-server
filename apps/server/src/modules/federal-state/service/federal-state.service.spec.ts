// import { Test, TestingModule } from '@nestjs/testing';
// import { FederalStateRepo } from '@shared/repo';
// import { federalStateFactory, setupEntities } from '@shared/testing';
// import { FederalState } from '@shared/domain';
// import { createMock, DeepMocked } from '@golevelup/ts-jest';
// import { FederalStateService } from './federal-state.service';
// import { FederalStateNames } from '../types/federal-state-names.enum';

import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { FederalStateRepo } from '../repo';
import { FederalStateService } from './federal-state.service';

// describe('FederalStateService', () => {
// 	let module: TestingModule;
// 	let service: FederalStateService;
// 	let federalStateRepo: DeepMocked<FederalStateRepo>;

// 	beforeAll(async () => {
// 		module = await Test.createTestingModule({
// 			providers: [
// 				FederalStateService,
// 				{
// 					provide: FederalStateRepo,
// 					useValue: createMock<FederalStateRepo>(),
// 				},
// 			],
// 		}).compile();

// 		service = module.get(FederalStateService);
// 		federalStateRepo = module.get(FederalStateRepo);

// 		await setupEntities();
// 	});

// 	afterAll(async () => {
// 		await module.close();
// 	});

// 	describe('findFederalStateByName', () => {
// 		const setup = () => {
// 			const federalState: FederalState = federalStateFactory.build({ name: FederalStateNames.NIEDERSACHEN });
// 			federalStateRepo.findByName.mockResolvedValue(federalState);

// 			return {
// 				federalState,
// 			};
// 		};

// 		it('should return a federal state', async () => {
// 			const { federalState } = setup();

// 			const result: FederalState = await service.findFederalStateByName(federalState.name);

// 			expect(result).toBeDefined();
// 		});
// 	});
// });

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

	describe('findFederalStateByName', () => {});

	describe('findAll', () => {});

	describe('create', () => {});

	describe('delete', () => {});
});
