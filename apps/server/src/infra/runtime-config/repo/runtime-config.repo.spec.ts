import { EntityManager } from '@mikro-orm/mongodb';
import { RuntimeConfigMikroOrmRepo } from './runtime-config.repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { cleanupCollections } from '@testing/cleanup-collections';
import { RuntimeConfigEntity } from './entity/runtime-config.entity';
import { RuntimeConfigDefaults } from '../domain/runtime-config-value.do';

describe('Runtime Config Repo', () => {
	let module: TestingModule;
	let repo: RuntimeConfigMikroOrmRepo;
	let em: EntityManager;

	const Configuration: RuntimeConfigDefaults[] = [
		{ key: 'TEST_STRING', type: 'string', value: 'a string' },
		{ key: 'TEST_NUMBER', type: 'number', value: 42 },
		{ key: 'TEST_BOOLEAN_TRUE', type: 'boolean', value: true },
		{ key: 'TEST_BOOLEAN_FALSE', type: 'boolean', value: false },
	];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BaseEntityWithTimestamps, RuntimeConfigEntity] })],
			providers: [
				RuntimeConfigMikroOrmRepo,
				{
					provide: 'RUNTIME_CONFIG_DEFINITIONS',
					useValue: Configuration,
				},
			],
		}).compile();
		repo = module.get(RuntimeConfigMikroOrmRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('persistance', () => {
		it('should refuse to persist value without default definition', async () => {
			await expect(() => repo.getByKey('NON_EXISTING_KEY')).rejects.toThrowError();
		});

		it('should return default value when not set', async () => {
			const found = await em.find(RuntimeConfigEntity, { key: 'TEST_STRING' });
			if (found.length > 0) {
				await em.removeAndFlush(found);
			}

			const retrieved = await repo.getByKey('TEST_STRING');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					key: 'TEST_STRING',
					type: 'string',
					value: 'a string',
				})
			);
		});

		it('should persist string runtime value', async () => {
			const original = await repo.getByKey('TEST_STRING');
			original.setValue('changed a value');

			await repo.save(original);

			const retrieved = await repo.getByKey('test-config');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: original.id,
					key: 'test-config',
					type: 'string',
					value: 'changed a value',
				})
			);
		});

		it('should persist number runtime value', async () => {
			const original = await repo.getByKey('TEST_NUMBER');
			original.setValue(100);

			await repo.save(original);

			const retrieved = await repo.getByKey('test-config');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: original.id,
					key: 'test-config',
					type: 'number',
					value: 100,
				})
			);
		});
	});

	describe('errors', () => {
		it.todo('should throw when number is not a number in db', async () => {});

		it.todo('should throw when string is not a string in db', async () => {});

		it.todo('should throw when boolean is not a boolean in db', async () => {});
	});
});
