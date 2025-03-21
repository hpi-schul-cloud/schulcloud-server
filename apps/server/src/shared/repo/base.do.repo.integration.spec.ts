import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { Entity, EntityData, EntityName, Property } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseDO } from '@shared/domain/domainobject';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { MongoMemoryDatabaseModule } from '@testing/database';

const TEST_CREATED_AT = new Date('2022-01-01');

describe('BaseDORepo', () => {
	@Entity()
	class TestEntity extends BaseEntityWithTimestamps {
		@Property()
		name: string;

		constructor(props: TestEntityProperties = { name: 'test' }) {
			super();
			this.name = props.name;
		}
	}

	class TestDO extends BaseDO {
		name: string;

		createdAt?: Date = new Date();

		constructor(entityDO: TestDO = { name: 'test' }) {
			super();
			this.id = entityDO.id;
			this.name = entityDO.name;
			this.createdAt = TEST_CREATED_AT;
		}
	}

	interface TestEntityProperties {
		name: string;
	}

	@Injectable()
	class TestRepo extends BaseDORepo<TestDO, TestEntity> {
		get entityName(): EntityName<TestEntity> {
			return TestEntity;
		}

		mapEntityToDO(entity: TestEntity): TestDO {
			return new TestDO({ id: entity.id, name: entity.name });
		}

		mapDOToEntityProperties(entityDO: TestDO): EntityData<TestEntity> {
			return {
				name: entityDO.name,
				createdAt: TEST_CREATED_AT,
			};
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
			providers: [
				TestRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
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

	describe('entityName', () => {
		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(TestEntity);
		});
	});

	describe('save', () => {
		it('should persist and flush a single new entity', async () => {
			const testDO = new TestDO({ name: 'test' });

			await repo.save(testDO);
			em.clear();

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(1);
			expect(result[0].createdAt).not.toEqual(TEST_CREATED_AT);
		});

		it('should persist and flush a single updated entity', async () => {
			const testEntity = em.create(TestEntity, new TestEntity());
			await em.persistAndFlush(testEntity);

			const testDO = new TestDO({ id: testEntity.id, name: 'test123' });

			await repo.save(testDO);
			em.clear();

			const result: TestEntity[] = await em.find(TestEntity, {});
			expect(result).toHaveLength(1);
			expect(result[0].createdAt).toEqual(testEntity.createdAt);
			expect(result[0].updatedAt.getTime()).toBeGreaterThanOrEqual(testEntity.updatedAt.getTime());
			expect(result[0].name).toEqual(testDO.name);
		});
	});

	describe('saveAll', () => {
		it('should save an entity array', async () => {
			const testDO1 = new TestDO({ name: 'test1' });
			const testDO2 = new TestDO({ name: 'test2' });

			await repo.saveAll([testDO1, testDO2]);
			em.clear();

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(2);
			expect(result[0].name).toEqual('test1');
			expect(result[1].name).toEqual('test2');
		});
	});

	describe('deleteById', () => {
		describe('single entity', () => {
			it('should remove a single entity', async () => {
				const testEntity = new TestEntity();
				await em.persistAndFlush(testEntity);
				em.clear();

				await repo.deleteById(testEntity.id);
				em.clear();

				expect(await em.findOne(TestEntity, testEntity.id)).toBeNull();
			});

			it('should remove a single entity and return 1', async () => {
				const testEntity = new TestEntity();
				await em.persistAndFlush(testEntity);
				em.clear();

				const result: number = await repo.deleteById(testEntity.id);

				expect(result).toEqual(1);
			});
		});

		describe('multiple entities', () => {
			it('should remove an array of entities', async () => {
				const testEntity1 = new TestEntity();
				const testEntity2 = new TestEntity();
				await em.persistAndFlush([testEntity1, testEntity2]);
				em.clear();

				await repo.deleteById([testEntity1.id, testEntity2.id]);
				em.clear();

				expect(await em.findOne(TestEntity, testEntity1.id)).toBeNull();
				expect(await em.findOne(TestEntity, testEntity2.id)).toBeNull();
			});

			it('should remove a two entity and return 2', async () => {
				const testEntity1 = new TestEntity();
				const testEntity2 = new TestEntity();
				await em.persistAndFlush([testEntity1, testEntity2]);
				em.clear();

				const result: number = await repo.deleteById([testEntity1.id, testEntity2.id]);

				expect(result).toEqual(2);
			});
		});
	});

	describe('findById', () => {
		it('should find entity', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const result: TestDO = await repo.findById(testEntity1.id);

			expect(result.id).toEqual(testEntity1.id);
		});

		it('should throw if entity not found', async () => {
			const testEntity1 = new TestEntity();
			const testEntity2 = new TestEntity();
			await em.persistAndFlush([testEntity1, testEntity2]);
			em.clear();

			const unknownId = new ObjectId().toHexString();

			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow('TestEntity not found');
		});
	});

	describe('delete is called', () => {
		const setupDelete = async () => {
			const testEntity1 = new TestEntity({ name: 'test1' });
			const testEntity2 = new TestEntity({ name: 'test2' });
			await em.persistAndFlush([testEntity1, testEntity2]);

			const testDO1 = new TestDO({ id: testEntity1.id, name: testEntity1.name });
			const testDO2 = new TestDO({ id: testEntity2.id, name: testEntity2.name });

			em.clear();
			return {
				testEntity1,
				testEntity2,
				testDO1,
				testDO2,
			};
		};

		describe('when domainObject is given', () => {
			it('should remove the entity', async () => {
				const { testDO1, testEntity1 } = await setupDelete();

				await repo.delete(testDO1);

				const entities: TestEntity[] = await em.find(repo.entityName, {});

				expect(entities.length).toEqual(1);
				expect(entities.includes(testEntity1)).toBeFalsy();
			});
		});

		describe('when array of domainObjects is given', () => {
			it('should remove the entities', async () => {
				const { testDO1, testDO2 } = await setupDelete();

				await repo.delete([testDO1, testDO2]);

				const entities: TestEntity[] = await em.find(repo.entityName, {});

				expect(entities.length).toEqual(0);
			});
		});

		describe('when domainobject has no id', () => {
			it('should throw an error', async () => {
				const { testDO1 } = await setupDelete();

				testDO1.id = undefined;

				await expect(repo.delete([testDO1])).rejects.toThrowError();
			});
		});
	});
});
