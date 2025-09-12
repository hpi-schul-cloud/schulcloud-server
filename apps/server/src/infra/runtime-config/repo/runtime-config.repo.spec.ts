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

	it('should persist runtime value', async () => {
		expect(repo).toBeDefined();

		// todo: inject values
		const runtimeConfigValue = RuntimeConfigValueFactory.build({
			id: new ObjectID().toHexString(),
			key: 'test-config',
		});

		await repo.save(runtimeConfigValue);

		const retrieved = await repo.getByKey('test-config');

		expect(retrieved).toEqual(
			expect.objectContaining({
				id: runtimeConfigValue.id,
			})
		);
	});
});
