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

	describe('persistAll', () => {
		it('should persist multiple entities', () => {
			const testEntities = Array.from(Array(5)).map(() => new TestEntity());
			repo.persistAll(testEntities);
			expect(em.getUnitOfWork().getPersistStack().size).toBe(testEntities.length);
		});
	});

	describe('persistAllAndFlush', () => {
		it('should persist and flush multiple entities', async () => {
			const testEntities = Array.from(Array(5)).map(() => new TestEntity());
			await repo.persistAllAndFlush(testEntities);

			const testEntityIds = testEntities.map((n) => n.id);

			const found = await Promise.all(testEntityIds.map(async (id) => em.findOne(TestEntity, id)));
			expect(found.length).toBe(testEntities.length);

			const expectedIds = found.map((n) => n && n.id).sort();
			expect(expectedIds).toStrictEqual(testEntityIds);
		});
	});

	describe('remove', () => {
		it('should remove entity', async () => {
			const testEntity = new TestEntity();
			const persisted = await repo.persistAndFlush(testEntity);

			repo.remove(persisted);
			expect(em.getUnitOfWork().getRemoveStack().size).toBe(1);
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

	describe('removeAll', () => {
		it('should remove multiple entities', async () => {
			const testEntities = Array.from(Array(5)).map(() => {
				const testEntity = new TestEntity();
				em.persist(testEntity);
				return testEntity;
			});
			await em.flush();

			repo.removeAll(testEntities);
			expect(em.getUnitOfWork().getRemoveStack().size).toBe(testEntities.length);
		});
	});

	describe('removeAllAndFlush', () => {
		it('should remove and flush multiple entities', async () => {
			const testEntities = Array.from(Array(5)).map(() => {
				const testEntity = new TestEntity();
				em.persist(testEntity);
				return testEntity;
			});
			await em.flush();

			await repo.removeAllAndFlush(testEntities);

			await Promise.all(
				testEntities.map(async (testEntity) => {
					expect(await em.findOne(TestEntity, testEntity.id)).toBeNull();
				})
			);
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
});
