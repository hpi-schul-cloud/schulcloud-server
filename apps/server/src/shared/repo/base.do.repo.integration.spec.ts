import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Entity, EntityName, Property } from '@mikro-orm/core';
import { BaseDO, BaseEntity } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo/base.do.repo';

describe('BaseDORepo', () => {
	@Entity()
	class TestEntity extends BaseEntity {
		@Property()
		name = 'test';
	}

	class TestDO extends BaseDO {
		name = 'test';

		constructor(entityDO: TestDO) {
			super();
			this.id = entityDO.id;
			this.name = entityDO.name;
		}
	}

	@Injectable()
	class TestRepo extends BaseDORepo<TestDO, TestEntity> {
		get entityName(): EntityName<TestEntity> {
			return TestEntity;
		}

		mapEntityToDO(entity: TestEntity): TestDO {
			return new TestDO({ id: entity.id, name: entity.name });
		}

		mapDOToEntity(entityDO: TestDO): TestEntity {
			const testEntity: TestEntity = new TestEntity();
			testEntity.id = entityDO.id as string;
			testEntity.name = entityDO.name;
			return testEntity;
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
		em.clear();
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

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(TestEntity);
		});
	});

	describe('save', () => {
		it('should persist and flush a single entity', async () => {
			const testDO = new TestDO({ id: '', name: 'test' });

			await repo.save(testDO);
			em.clear();

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(1);
		});

		it('should persist and flush an entity array', async () => {
			const testDO1 = new TestDO({ id: '', name: 'test' });
			const testDO2 = new TestDO({ id: '', name: 'test' });

			await repo.save([testDO1, testDO2]);
			em.clear();

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(2);
		});
	});

	describe('delete', () => {
		it('should remove and flush a single entity', async () => {
			const testEntity = new TestEntity();
			await em.persistAndFlush(testEntity);
			em.clear();

			const testDo = await repo.findById(testEntity.id);
			await repo.delete(testDo);
			em.clear();

			expect(await em.findOne(TestEntity, testEntity.id)).toBeNull();
		});

		it('should remove and flush an array of entities', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const testDo1 = await repo.findById(testEntity1.id);
			const testDo2 = await repo.findById(testEntity2.id);
			await repo.delete([testDo1, testDo2]);
			em.clear();

			expect(await em.findOne(TestEntity, testEntity1.id)).toBeNull();
			expect(await em.findOne(TestEntity, testEntity2.id)).toBeNull();
		});
	});

	describe('findById', () => {
		it('should find entity', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const result = await repo.findById(testEntity1.id);

			expect(result).toEqual(repo.mapEntityToDO(testEntity1));
		});

		it('should throw if entity not found', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const unknownId = new ObjectId().toHexString();

			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow(`TestEntity not found ('${unknownId}')`);
		});
	});
});
