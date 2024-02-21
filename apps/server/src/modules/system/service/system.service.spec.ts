import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { SystemRepo } from '../repo';
import { SystemService } from './system.service';

describe(SystemService.name, () => {
	let module: TestingModule;
	let service: SystemService;

	let systemRepo: DeepMocked<SystemRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemService,
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
			],
		}).compile();

		service = module.get(SystemService);
		systemRepo = module.get(SystemRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when the system exists', () => {
			const setup = () => {
				const system = systemFactory.build();

				systemRepo.findById.mockResolvedValueOnce(system);

				return {
					system,
				};
			};

			it('should return the system', async () => {
				const { system } = setup();

				const result = await service.findById(system.id);

				expect(result).toEqual(system);
			});
		});

		describe('when the system does not exist', () => {
			const setup = () => {
				systemRepo.findById.mockResolvedValueOnce(null);
			};

			it('should return null', async () => {
				setup();

				const result = await service.findById(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('delete', () => {
		describe('when the system was deleted', () => {
			const setup = () => {
				const system = systemFactory.build();

				systemRepo.delete.mockResolvedValueOnce(true);

				return {
					system,
				};
			};

			it('should return true', async () => {
				const { system } = setup();

				const result = await service.delete(system);

				expect(result).toEqual(true);
			});
		});

		describe('when the system was not deleted', () => {
			const setup = () => {
				const system = systemFactory.build();

				systemRepo.delete.mockResolvedValueOnce(false);

				return {
					system,
				};
			};

			it('should return false', async () => {
				const { system } = setup();

				const result = await service.delete(system);

				expect(result).toEqual(false);
			});
		});
	});
});
