import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Entity } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
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
		it('should persist and flush entities', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();

			await repo.save([testEntity1, testEntity2]);

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(2);
			expect(result).toStrictEqual([testEntity1, testEntity2]);
		});
	});

	describe('delete', () => {
		it('should remove and flush entities', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);

			await repo.delete([testEntity1, testEntity2]);

			await expect(async () => {
				await em.findOneOrFail(TestEntity, testEntity1.id);
			}).rejects.toThrow(`TestEntity not found ('${testEntity1.id}')`);
			await expect(async () => {
				await em.findOneOrFail(TestEntity, testEntity2.id);
			}).rejects.toThrow(`TestEntity not found ('${testEntity2.id}')`);
		});
	});

	describe('persist', () => {
		it('should persist an entity', () => {
			const testEntity = new TestEntity();

			repo.persist(testEntity);
			expect(em.getUnitOfWork().getPersistStack().size).toBe(1);
		});
	});

	describe('persistAndFlush', () => {
		it('should persist and flush an entity', async () => {
			const testEntity = new TestEntity();

			repo.persist(testEntity);
			expect(testEntity.id).toBeNull();
			await repo.flush();
			const expectedResult = await em.findOne(TestEntity, testEntity.id);
			expect(testEntity).toStrictEqual(expectedResult);
		});
	});

	describe('removeAndFlush', () => {
		it('should remove and flush entity', async () => {
			const testEntity = new TestEntity();
			const persisted = await repo.persistAndFlush(testEntity);

			await repo.removeAndFlush(persisted);

			expect(await em.findOne(TestEntity, persisted.id)).toBeNull();
		});
	});

	describe('flush', () => {
		it('should flush after save', async () => {
			const testEntity = new TestEntity();
			repo.persist(testEntity);

			expect(testEntity.id).toBeNull();

			await repo.flush();

			expect(testEntity.id).not.toBeNull();
		});
	});

	describe('getObjectReference', () => {
		it('should return a valid reference', async () => {
			const testEntity = new TestEntity();
			repo.persist(testEntity);

			await repo.flush();

			const reference = repo.getObjectReference(TestEntity, testEntity.id);

			expect(reference).toBeDefined();
		});
	});
});
