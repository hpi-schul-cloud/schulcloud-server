import { EntityManager } from '@mikro-orm/mongodb';
import { RuntimeConfigMikroOrmRepo } from './runtime-config.repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { cleanupCollections } from '@testing/cleanup-collections';
import { RuntimeConfigEntity, RuntimeConfigProperties } from './entity/runtime-config.entity';
import { RuntimeConfigDefault } from '../domain/runtime-config-value.do';
import { RUNTIME_CONFIG_DEFAULTS } from '../injection-keys';

describe('Runtime Config Repo', () => {
	let module: TestingModule;
	let repo: RuntimeConfigMikroOrmRepo;
	let em: EntityManager;

	const Configuration: RuntimeConfigDefault[] = [
		{ key: 'TEST_STRING', type: 'string', value: 'a string' },
		{ key: 'TEST_NUMBER', type: 'number', value: 42 },
		{ key: 'TEST_BOOLEAN', type: 'boolean', value: true },
	];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BaseEntityWithTimestamps, RuntimeConfigEntity] })],
			providers: [
				RuntimeConfigMikroOrmRepo,
				{
					provide: RUNTIME_CONFIG_DEFAULTS,
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
		it('should return default value when not set', async () => {
			const found = await em.find(RuntimeConfigEntity, { key: 'TEST_STRING' });
			if (found.length > 0) {
				await em.remove(found).flush();
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

			const retrieved = await repo.getByKey('TEST_STRING');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: original.id,
					key: 'TEST_STRING',
					type: 'string',
					value: 'changed a value',
				})
			);
		});

		it('should persist number runtime value', async () => {
			const original = await repo.getByKey('TEST_NUMBER');
			original.setValue(100);

			await repo.save(original);

			const retrieved = await repo.getByKey('TEST_NUMBER');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: original.id,
					key: 'TEST_NUMBER',
					type: 'number',
					value: 100,
				})
			);
		});

		it('should persist boolean runtime value', async () => {
			const original = await repo.getByKey('TEST_BOOLEAN');
			original.setValue(false);

			await repo.save(original);

			const retrieved = await repo.getByKey('TEST_BOOLEAN');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: original.id,
					key: 'TEST_BOOLEAN',
					type: 'boolean',
					value: false,
				})
			);
		});
	});

	describe('getAll', () => {
		it('should return all default values', async () => {
			const all = await repo.getAll();

			expect(all).toHaveLength(3);
		});

		it('should reflect persisted changes', async () => {
			const original = await repo.getByKey('TEST_STRING');
			original.setValue('changed a value');
			await repo.save(original);

			const retrieved = await repo.getAll();

			expect(retrieved.map((r) => r.getProps())).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						key: 'TEST_STRING',
						value: 'changed a value',
					}),
				])
			);
		});

		it('should not include values that are not defined in the default values.', async () => {
			const entity = new RuntimeConfigEntity({
				key: 'UNDEFINED_IN_CONFIG',
				type: 'string',
				value: 'some value',
			});
			await em.persistAndFlush(entity);

			const retrieved = await repo.getAll();
			expect(retrieved.map((r) => r.getProps())).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						key: 'UNDEFINED_IN_CONFIG',
					}),
				])
			);
		});
	});

	describe('errors', () => {
		it('should throw when number is not a number in db', async () => {
			const entity = new RuntimeConfigEntity({
				key: 'TEST_NUMBER',
				type: 'number',
				value: 'not a number',
			} as unknown as RuntimeConfigProperties);
			await em.persistAndFlush(entity);
			await expect(() => repo.getByKey('TEST_NUMBER')).rejects.toThrowError();
		});

		it('should not return db value when not defined in config', async () => {
			const entity = new RuntimeConfigEntity({
				key: 'UNDEFINED_IN_CONFIG',
				type: 'string',
				value: 'some value',
			});
			await em.persistAndFlush(entity);
			await expect(() => repo.getByKey('UNDEFINED_IN_CONFIG')).rejects.toThrowError();
		});

		it('should throw when type in db is unknown', async () => {
			const entity = new RuntimeConfigEntity({
				key: 'TEST_NUMBER',
				type: 'infinite number',
				value: 'its a lot',
			} as unknown as RuntimeConfigProperties);
			await em.persistAndFlush(entity);
			await expect(() => repo.getByKey('TEST_NUMBER')).rejects.toThrowError();
		});
	});
});
