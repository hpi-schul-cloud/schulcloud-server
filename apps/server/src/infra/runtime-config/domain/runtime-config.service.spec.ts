import { Test, TestingModule } from '@nestjs/testing';
import { RuntimeConfigService } from './runtime-config.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RuntimeConfigRepo } from './runtime-config.repo.interface';
import { runtimeConfigTestingFactory } from '../testing/runtime-config-value.testing.factory';

describe('RuntimeConfigService', () => {
	let module: TestingModule;
	let service: RuntimeConfigService;
	let repo: DeepMocked<RuntimeConfigRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RuntimeConfigService,
				{
					provide: 'RUNTIME_CONFIG_REPO',
					useValue: createMock<RuntimeConfigRepo>(),
				},
			],
		}).compile();
		service = module.get(RuntimeConfigService);
		repo = module.get('RUNTIME_CONFIG_REPO');
	});

	describe('getByKey', () => {
		it('returns a DO', async () => {
			const configValue = runtimeConfigTestingFactory.build();
			repo.getByKey.mockResolvedValue(configValue);
			const result = await service.getByKey(configValue.key);
			expect(result).toEqual(configValue);
		});
	});

	describe('findAll', () => {
		it('should return list of runtime config values', async () => {
			const configValues = runtimeConfigTestingFactory.buildList(3);
			repo.getAll.mockResolvedValue(configValues);
			const result = await service.findAll();
			expect(result).toEqual(configValues);
		});
	});

	describe('getString', () => {
		it('returns a string value', async () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'a string' });
			repo.getByKey.mockResolvedValue(configValue);
			const result = await service.getString(configValue.key);
			expect(result).toEqual('a string');
		});

		it('throws an error if the value is not a string', async () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 42 });
			repo.getByKey.mockResolvedValue(configValue);
			await expect(service.getString(configValue.key)).rejects.toThrowError();
		});
	});

	describe('getNumber', () => {
		it('returns a number value', async () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'number', value: 42 });
			repo.getByKey.mockResolvedValue(configValue);
			const result = await service.getNumber(configValue.key);
			expect(result).toEqual(42);
		});

		it('throws an error if the value is not a number', async () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'a string' });
			repo.getByKey.mockResolvedValue(configValue);
			await expect(service.getNumber(configValue.key)).rejects.toThrowError();
		});
	});

	describe('getBoolean', () => {
		it('returns a boolean value', async () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'boolean', value: true });
			repo.getByKey.mockResolvedValue(configValue);
			const result = await service.getBoolean(configValue.key);
			expect(result).toEqual(true);
		});

		it('throws an error if the value is not a boolean', async () => {
			const configValue = runtimeConfigTestingFactory.build({ type: 'string', value: 'not a boolean' });
			repo.getByKey.mockResolvedValue(configValue);
			await expect(service.getBoolean(configValue.key)).rejects.toThrowError();
		});
	});
});
