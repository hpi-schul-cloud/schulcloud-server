import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { InstanceRepo } from '../repo';
import { instanceFactory } from '../testing';
import { InstanceService } from './instance.service';

describe(InstanceService.name, () => {
	let module: TestingModule;
	let service: InstanceService;

	let instanceRepo: DeepMocked<InstanceRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				InstanceService,
				{
					provide: InstanceRepo,
					useValue: createMock<InstanceRepo>(),
				},
			],
		}).compile();

		service = module.get(InstanceService);
		instanceRepo = module.get(InstanceRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when a instance with the id exists', () => {
			const setup = () => {
				const instance = instanceFactory.build();

				instanceRepo.findById.mockResolvedValue(instance);

				return {
					instance,
				};
			};

			it('should return the instance', async () => {
				const { instance } = setup();

				const result = await service.findById(instance.id);

				expect(result).toEqual(instance);
			});
		});
	});

	describe('getInstance', () => {
		describe('when a instance exists', () => {
			const setup = () => {
				const instance = instanceFactory.build();

				instanceRepo.getInstance.mockResolvedValue(instance);

				return {
					instance,
				};
			};

			it('should return the instance', async () => {
				const { instance } = setup();

				const result = await service.getInstance();

				expect(result).toEqual(instance);
			});
		});
	});
});
