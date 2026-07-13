import { type DeepMocked, createMock } from '@golevelup/ts-jest';
import { FederalStateNames } from '@modules/legacy-school/types';
import { type FederalStateEntity, FederalStateRepo } from '@modules/school/repo';
import { federalStateEntityFactory } from '@modules/school/testing';
import { Test, type TestingModule } from '@nestjs/testing';
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
		describe('when federal state is found', () => {
			const setup = () => {
				const federalState: FederalStateEntity = federalStateEntityFactory.build({
					name: FederalStateNames.NIEDERSACHEN,
				});
				federalStateRepo.findByNameOrFail.mockResolvedValueOnce(federalState);

				return {
					federalState,
				};
			};

			it('should be returned', async () => {
				const { federalState } = setup();

				const result: FederalStateEntity = await service.findFederalStateByName(federalState.name);

				expect(result).toBeDefined();
			});
		});
	});

	describe('findOrCreateDefaultFederalState', () => {
		describe('when default federal state exist', () => {
			const setup = () => {
				const federalState: FederalStateEntity = federalStateEntityFactory.build({
					name: 'Default',
				});
				federalStateRepo.findByName.mockResolvedValue(federalState);

				return {
					federalState,
				};
			};
			it('should be returned', async () => {
				const { federalState } = setup();

				const result = await service.findOrCreateDefaultFederalState();
				expect(result.id).toBe(federalState.id);
				expect(federalStateRepo.create).not.toHaveBeenCalled();
				expect(federalStateRepo.save).not.toHaveBeenCalled();
			});
		});

		describe('when default federal state does not exist', () => {
			const setup = () => {
				const federalState: FederalStateEntity = federalStateEntityFactory.build({
					name: 'Default',
				});
				federalStateRepo.findByName.mockResolvedValue(null);
				federalStateRepo.create.mockReturnValueOnce(federalState);

				return {
					federalState,
				};
			};
			it('should be created and returned', async () => {
				const { federalState } = setup();

				const result = await service.findOrCreateDefaultFederalState();
				expect(result.id).toBe(federalState.id);
				expect(federalStateRepo.create).toHaveBeenCalled();
				expect(federalStateRepo.save).toHaveBeenCalled();
			});
		});
	});
});
