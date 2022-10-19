import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Entity, EntityName, Property } from '@mikro-orm/core';
import { BaseDO, BaseEntityWithTimestamps, IBaseEntityProps } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { Logger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';

describe('BaseDORepo', () => {
	@Entity()
	class TestEntity extends BaseEntityWithTimestamps {
		@Property()
		name: string;

		constructor(props: ITestEntityProperties = { name: 'test' }) {
			super();
			this.name = props.name;
		}
	}

	class TestDO extends BaseDO {
		name: string;

		constructor(entityDO: TestDO = { name: 'test' }) {
			super();
			this.id = entityDO.id;
			this.name = entityDO.name;
		}
	}

	type ITestEntityProperties = Readonly<Omit<TestEntity, keyof BaseEntityWithTimestamps>>;

	@Injectable()
	class TestRepo extends BaseDORepo<TestDO, TestEntity, ITestEntityProperties> {
		get entityName(): EntityName<TestEntity> {
			return TestEntity;
		}

		entityFactory(props: ITestEntityProperties): TestEntity {
			return new TestEntity(props);
		}

		mapEntityToDO(entity: TestEntity): TestDO {
			return new TestDO({ id: entity.id, name: entity.name });
		}

		mapDOToEntity(entityDO: TestDO): ITestEntityProperties & IBaseEntityProps {
			return {
				id: entityDO.id as string,
				name: entityDO.name,
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
					provide: Logger,
					useValue: createMock<Logger>(),
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

	describe('entityFactory', () => {
		const props: ITestEntityProperties = {
			name: 'name',
		};

		it('should return new entity of type TestEntity', () => {
			const result: TestEntity = repo.entityFactory(props);

			expect(result).toBeInstanceOf(TestEntity);
		});

		it('should return new entity with values from properties', () => {
			const result: TestEntity = repo.entityFactory(props);

			expect(result).toEqual(expect.objectContaining(props));
		});
	});

	describe('save', () => {
		it('should persist and flush a single new entity', async () => {
			const testDO = new TestDO({ name: 'test' });

			await repo.save(testDO);
			em.clear();

			const result = await em.find(TestEntity, {});
			expect(result).toHaveLength(1);
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
