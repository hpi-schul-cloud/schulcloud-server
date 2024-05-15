import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing/factory';
import { SYSTEM_REPO, SystemRepo } from '../domain';
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
					provide: SYSTEM_REPO,
					useValue: createMock<SystemRepo>(),
				},
			],
		}).compile();

		service = module.get(SystemService);
		systemRepo = module.get(SYSTEM_REPO);
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

				systemRepo.getSystemById.mockResolvedValueOnce(system);

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
				systemRepo.getSystemById.mockResolvedValueOnce(null);
			};

			it('should return null', async () => {
				setup();

				const result = await service.findById(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('getSystems', () => {
		describe('when systems exist', () => {
			const setup = () => {
				const systems = systemFactory.buildList(3);

				systemRepo.getSystemsByIds.mockResolvedValueOnce(systems);

				return {
					systems,
				};
			};

			it('should return the systems', async () => {
				const { systems } = setup();

				const result = await service.getSystems(systems.map((s) => s.id));

				expect(result).toEqual(systems);
			});
		});

		describe('when no systems exist', () => {
			const setup = () => {
				systemRepo.getSystemsByIds.mockResolvedValueOnce([]);
			};

			it('should return empty array', async () => {
				setup();

				const result = await service.getSystems([new ObjectId().toHexString()]);

				expect(result).toEqual([]);
			});
		});

		describe('when throwing an error', () => {
			const setup = () => {
				const systemIds = [new ObjectId().toHexString()];
				const error = new Error('Connection error');
				systemRepo.getSystemsByIds.mockRejectedValueOnce(error);

				return { systemIds, error };
			};

			it('should throw an error', async () => {
				const { systemIds, error } = setup();

				await expect(service.getSystems(systemIds)).rejects.toThrow(error);
			});
		});
	});

	describe('delete', () => {
		describe('when the system was deleted', () => {
			const setup = () => {
				const system = systemFactory.build();

				systemRepo.delete.mockResolvedValueOnce();

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

				systemRepo.delete.mockRejectedValueOnce(new Error('Not found'));

				return {
					system,
				};
			};

			it('should throw an error', async () => {
				const { system } = setup();

				await expect(service.delete(system)).rejects.toThrowError('Not found');
			});
		});
	});
});
