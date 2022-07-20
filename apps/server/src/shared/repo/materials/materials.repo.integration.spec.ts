import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Material } from '@shared/domain/entity/materials.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { materialFactory } from '@shared/testing/factory/material.factory';
import { MaterialsRepo } from './materials.repo';

describe('MaterialsRepo', () => {
	let module: TestingModule;
	let repo: MaterialsRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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

	describe('findById', () => {
		it('should find a material by its id', async () => {
			const material = materialFactory.build({ title: 'important material' });
			await em.persistAndFlush(material);
			em.clear();

			const foundMaterial = await repo.findById(material.id);
			expect(foundMaterial.title).toEqual('important material');
		});

		it('should throw error if the task cannot be found by id', async () => {
			const unknownId = new ObjectId().toHexString();
			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow();
		});
	});
});
