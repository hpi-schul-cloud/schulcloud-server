import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Material } from './materials.entity';
import { MaterialsRepo } from './materials.repo';

describe('MaterialsRepo', () => {
	let module: TestingModule;
	let repo: MaterialsRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [Material] })],
			providers: [MaterialsRepo],
		}).compile();

		repo = module.get(MaterialsRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(Material, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Material);
	});
});
