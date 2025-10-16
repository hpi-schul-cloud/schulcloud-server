import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { FederalStateNames } from '@modules/legacy-school/types';
import { FederalStateEntity, FederalStateRepo } from '@modules/school/repo';
import { federalStateEntityFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
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
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findFederalStateByName', () => {
		const setup = () => {
			const federalState: FederalStateEntity = federalStateEntityFactory.build({
				name: FederalStateNames.NIEDERSACHEN,
			});
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
