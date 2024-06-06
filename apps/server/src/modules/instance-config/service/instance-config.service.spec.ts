import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { InstanceConfigRepo } from '../repo';
import { instanceConfigFactory } from '../testing';
import { InstanceConfigService } from './inctance-config.service';

describe(InstanceConfigService.name, () => {
	let module: TestingModule;
	let service: InstanceConfigService;

	let instanceConfigRepo: DeepMocked<InstanceConfigRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				InstanceConfigService,
				{
					provide: InstanceConfigRepo,
					useValue: createMock<InstanceConfigRepo>(),
				},
			],
		}).compile();

		service = module.get(InstanceConfigService);
		instanceConfigRepo = module.get(InstanceConfigRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when a instance config with the id exists', () => {
			const setup = () => {
				const instanceConfig = instanceConfigFactory.build();

				instanceConfigRepo.findById.mockResolvedValue(instanceConfig);

				return {
					instanceConfig,
				};
			};

			it('should return the instance config', async () => {
				const { instanceConfig } = setup();

				const result = await service.findById(instanceConfig.id);

				expect(result).toEqual(instanceConfig);
			});
		});
	});
});
