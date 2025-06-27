import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Instance, InstanceService } from '@modules/instance';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { InstancesSeedDataService } from './instances-seed-data.service';

describe(InstancesSeedDataService.name, () => {
	let module: TestingModule;
	let service: InstancesSeedDataService;

	let configService: DeepMocked<ConfigService>;
	let instanceService: DeepMocked<InstanceService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				InstancesSeedDataService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: InstanceService,
					useValue: createMock<InstanceService>(),
				},
			],
		}).compile();

		service = module.get(InstancesSeedDataService);
		configService = module.get(ConfigService);
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
				configService.get.mockReturnValueOnce('dbc'); // SC_SHORTNAME
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
