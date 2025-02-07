import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageProviderEntity } from '@shared/domain/entity';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { storageProviderFactory } from '@testing/factory/storageprovider.factory';
import { StorageProviderRepo } from './storageprovider.repo';

describe('StorageProviderRepo', () => {
	let module: TestingModule;
	let repo: StorageProviderRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [StorageProviderEntity] })],
			providers: [StorageProviderRepo],
		}).compile();

		repo = module.get(StorageProviderRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		em.clear();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(StorageProviderEntity);
	});

	describe('findAll', () => {
		it('should return all storage providers', async () => {
			const storageProviders = storageProviderFactory.buildList(3);
			await em.persistAndFlush(storageProviders);

			const result = await repo.findAll();

			expect(result.length).toEqual(3);
		});
	});
});
