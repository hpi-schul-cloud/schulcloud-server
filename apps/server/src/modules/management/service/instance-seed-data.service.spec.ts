import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Instance, InstanceService } from '@modules/instance';
import { Test, TestingModule } from '@nestjs/testing';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from '../management-seed-data.config';
import { InstancesSeedDataService } from './instances-seed-data.service';

describe(InstancesSeedDataService.name, () => {
	let module: TestingModule;
	let service: InstancesSeedDataService;

	let config: ManagementSeedDataConfig;
	let instanceService: DeepMocked<InstanceService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				InstancesSeedDataService,
				{
					provide: MANAGEMENT_SEED_DATA_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		service = module.get(InstancesSeedDataService);
		config = module.get(MANAGEMENT_SEED_DATA_CONFIG_TOKEN);
		instanceService = module.get(InstanceService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('import', () => {
		describe('when creating seed data for the instance', () => {
			const setup = () => {
				config.scShortName = 'dbc';
			};

			it('should import the instance', async () => {
				setup();

				await service.import();

				expect(instanceService.save).toHaveBeenCalledWith<[Instance]>(
					new Instance({ id: '666076ad83d1e69b5c692efd', name: 'dbc' })
				);
			});

			it('should return 1', async () => {
				setup();

				const result = await service.import();

				expect(result).toEqual(1);
			});
		});
	});
});
