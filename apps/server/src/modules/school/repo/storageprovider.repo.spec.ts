import { EntityManager } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { env } from 'node:process';
import { storageProviderFactory } from '../testing';
import { StorageProviderEntity } from './storageprovider.entity';
import { StorageProviderRepo } from './storageprovider.repo';

describe('StorageProviderRepo', () => {
	let module: TestingModule;
	let repo: StorageProviderRepo;
	let em: EntityManager;

	beforeAll(async () => {
		env.S3_KEY = env.S3_KEY ?? 'test-s3-key';

		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [StorageProviderEntity] })],
			providers: [StorageProviderRepo],
		}).compile();

		repo = module.get(StorageProviderRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		delete env.S3_KEY;
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
			await em.persist(storageProviders).flush();

			const result = await repo.findAll();

			expect(result.length).toEqual(3);
		});
	});
});
