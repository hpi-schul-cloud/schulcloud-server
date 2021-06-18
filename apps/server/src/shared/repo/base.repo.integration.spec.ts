import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Entity } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from './base.repo';

describe('BaseRepo', () => {
	@Entity()
	class TestEntity extends BaseEntity {}

	@Injectable()
	class TestRepo extends BaseRepo<TestEntity> {}

	let repo: TestRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [TestEntity],
				}),
			],
			providers: [TestRepo],
		}).compile();

		repo = module.get(TestRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(TestEntity, {});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('save', () => {
		it('should create and persist an entity', async () => {
			const testEntity = new TestEntity();

			await repo.save(testEntity);
			expect(testEntity.id).toBeDefined();
			const expectedResult = await em.findOne(TestEntity, testEntity.id);
			expect(testEntity).toStrictEqual(expectedResult);
		});
	});

	describe('saveAll', () => {
		it('should create multiple entities and save them', async () => {
			const testEntities = Array.from(Array(5)).map(() => new TestEntity());
			await repo.saveAll(testEntities);

			const testEntityIds = testEntities.map((n) => n.id);

			const found = await Promise.all(testEntityIds.map(async (id) => em.findOne(TestEntity, id)));
			expect(found.length).toBe(testEntities.length);

			const expectedIds = found.map((n) => n && n.id).sort();
			expect(expectedIds).toStrictEqual(testEntityIds);
		});
	});

	describe('delete', () => {
		it('should delete entity', async () => {
			const testEntity = new TestEntity();
			const persisted = await repo.save(testEntity);

			await repo.delete(persisted);

			expect(await em.findOne(TestEntity, persisted.id)).toBeNull();
		});
	});

	describe('deleteAll', () => {
		it('should delete multiple entities', async () => {
			const testEntities = Array.from(Array(5)).map(() => {
				const testEntity = new TestEntity();
				em.persist(testEntity);
				return testEntity;
			});
			await em.flush();

			await repo.deleteAll(testEntities);

			await Promise.all(
				testEntities.map(async (testEntity) => {
					expect(await em.findOne(TestEntity, testEntity.id)).toBeNull();
				})
			);
		});
	});
});
