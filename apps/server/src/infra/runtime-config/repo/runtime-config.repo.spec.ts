import { EntityManager } from '@mikro-orm/mongodb';
import { RuntimeConfigMikroOrmRepo } from './runtime-config.repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { cleanupCollections } from '@testing/cleanup-collections';
import { RuntimeConfigEntity } from './entity/runtime-config.entity';
import { ObjectID } from 'bson';
import { RuntimeConfigValueFactory } from '../domain/runtime-config-value.factory';

describe('Runtime Config Repo', () => {
	let module: TestingModule;
	let repo: RuntimeConfigMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [BaseEntityWithTimestamps, RuntimeConfigEntity] })],
			providers: [RuntimeConfigMikroOrmRepo],
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
		it('should persist string runtime value', async () => {
			// todo: inject values
			const runtimeConfigValue = RuntimeConfigValueFactory.build({
				id: new ObjectID().toHexString(),
				key: 'test-config',
				type: 'string',
				value: 'a value',
			});

			await repo.save(runtimeConfigValue);

			const retrieved = await repo.getByKey('test-config');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: runtimeConfigValue.id,
					key: 'test-config',
					type: 'string',
					value: 'a value',
				})
			);
		});

		it('should persist number runtime value', async () => {
			// todo: inject values
			const runtimeConfigValue = RuntimeConfigValueFactory.build({
				id: new ObjectID().toHexString(),
				key: 'test-config',
				type: 'number',
				value: 42,
			});

			await repo.save(runtimeConfigValue);

			const retrieved = await repo.getByKey('test-config');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: runtimeConfigValue.id,
					key: 'test-config',
					type: 'number',
					value: 42,
				})
			);
		});

		it('should persist boolean truthy runtime value', async () => {
			// todo: inject values
			const runtimeConfigValue = RuntimeConfigValueFactory.build({
				id: new ObjectID().toHexString(),
				key: 'test-config',
				type: 'boolean',
				value: true,
			});

			await repo.save(runtimeConfigValue);

			const retrieved = await repo.getByKey('test-config');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: runtimeConfigValue.id,
					key: 'test-config',
					type: 'boolean',
					value: true,
				})
			);
		});

		it('should persist boolean falsy runtime value', async () => {
			// todo: inject values
			const runtimeConfigValue = RuntimeConfigValueFactory.build({
				id: new ObjectID().toHexString(),
				key: 'test-config',
				type: 'boolean',
				value: false,
			});

			await repo.save(runtimeConfigValue);

			const retrieved = await repo.getByKey('test-config');

			expect(retrieved.getProps()).toEqual(
				expect.objectContaining({
					id: runtimeConfigValue.id,
					key: 'test-config',
					type: 'boolean',
					value: false,
				})
			);
		});
	});

	describe('default values', () => {
		it.todo('should return default value when not set');
	});

	describe('errors', () => {
		it('should throw when number is not a number', async () => {
			expect(repo).toBeDefined();

			// todo: inject values
			const runtimeConfigValueEntity = new RuntimeConfigEntity({
				key: 'test-config',
				type: 'number',
				value: 'not-a-number',
			});

			await em.persistAndFlush(runtimeConfigValueEntity);

			await expect(() => repo.getByKey('test-config')).rejects.toThrowError();
		});
	});
});
