import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Entity, EntityName } from '@mikro-orm/core';
import { BaseEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from './base.repo';

describe('BaseRepo', () => {
	@Entity()
	class TestEntity extends BaseEntity {
		name = 'test';
	}

	@Injectable()
	class TestRepo extends BaseRepo<TestEntity> {
		protected get entityName(): EntityName<TestEntity> {
			return TestEntity;
		}
	}

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

	describe('findOneById', () => {
		it('should find entity', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);

			const result = await repo.findOneById(testEntity1.id);

			expect(result).toEqual(testEntity1);
		});

		it('should throw if entity not found', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);

			const unknownId = new ObjectId().toHexString();

			await expect(async () => {
				await repo.findOneById(unknownId);
			}).rejects.toThrow(`TestEntity not found ('${unknownId}')`);
		});
	});

	describe('findOne', () => {
		it('should find entity', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);

			const result = await repo.findOne(testEntity1.id);

			expect(result).toEqual(testEntity1);
		});

		it('should throw if entity not found', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);

			const unknownValue = 'otherName';

			await expect(async () => {
				await repo.findOne({ name: unknownValue });
			}).rejects.toThrow(`TestEntity not found ({ name: '${unknownValue}' })`);
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
