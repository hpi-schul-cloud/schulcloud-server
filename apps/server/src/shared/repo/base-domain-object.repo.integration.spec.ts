import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { Entity, EntityData, EntityName, Property } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { LegacyLogger } from '@src/core/logger';

describe('BaseDomainObjectRepo', () => {
	interface TestEntityProperties {
		id: EntityId;
		name: string;
	}

	interface TestDOProps extends AuthorizableObject {
		name: string;
		createdAt?: Date;
		updatedAt?: Date;
	}

	@Entity()
	class TestEntity extends BaseEntityWithTimestamps {
		@Property()
		name: string;

		constructor(props: TestEntityProperties) {
			super();
			this.name = props.name;
		}
	}

	class TestDO extends DomainObject<TestDOProps> {}

	@Injectable()
	class TestRepo extends BaseDomainObjectRepo<TestDO, TestEntity> {
		get entityName(): EntityName<TestEntity> {
			return TestEntity;
		}

		mapEntityToDO(entity: TestEntity): TestDO {
			const { id, name, createdAt, updatedAt } = entity;
			return new TestDO({ id, name, createdAt, updatedAt });
		}

		mapDOToEntityProperties(entityDO: TestDO): EntityData<TestEntity> {
			const { id, name, createdAt, updatedAt } = entityDO.getProps();
			return {
				id,
				name,
				createdAt,
				updatedAt,
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
		jest.clearAllMocks();
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
		describe('when create new entity', () => {
			const setup = () => {
				const oid = new ObjectId();

				const dob = new TestDO({ id: oid.toHexString(), name: 'test' });
				const spyCreate = jest.spyOn(em, 'create');

				const { id, ...expected } = dob.getProps();
				return { dob, spyCreate, oid, expected };
			};

			it('should call em.create', async () => {
				const { dob, spyCreate, oid, expected } = setup();

				const savedDob = await repo.save(dob);

				expect(savedDob).toBeInstanceOf(TestDO);
				expect(spyCreate).toHaveBeenCalledWith(TestEntity, { ...expected, _id: oid });
			});

			it('should find a persisted entity', async () => {
				const { dob } = setup();

				const savedDob = await repo.save(dob);

				const entity = await em.findOne(TestEntity, { id: savedDob.id });

				expect(entity).toBeInstanceOf(TestEntity);
				expect(entity?.id).toEqual(savedDob.id);
			});

			it('should save a single domain object', async () => {
				const { dob } = setup();

				const savedDob = await repo.save(dob);

				expect(savedDob).toBeInstanceOf(TestDO);

				expect(savedDob.getProps()).toEqual(dob.getProps());
			});
		});

		describe('when update existing entity', () => {
			const setup = async () => {
				const entity = new TestEntity({ name: 'test', id: new ObjectId().toHexString() });
				await em.persistAndFlush(entity);

				const dob = new TestDO({ id: entity.id, name: 'test' });
				const spyAssign = jest.spyOn(em, 'assign');

				const { id, ...expected } = dob.getProps();

				return { entity, dob, spyAssign, expected };
			};

			it('should call em.assign', async () => {
				const { dob, spyAssign, expected } = await setup();

				const savedDob = await repo.save(dob);

				expect(savedDob).toBeInstanceOf(TestDO);
				expect(spyAssign).toHaveBeenCalledWith(expect.any(TestEntity), expected);
			});

			it('should save a single domain object', async () => {
				const { dob } = await setup();

				const savedDob = await repo.save(dob);

				expect(savedDob).toBeInstanceOf(TestDO);
				expect(savedDob.getProps()).toEqual(dob.getProps());
			});

			it('should update a single domain object', async () => {
				const { dob } = await setup();

				const updatedDob = new TestDO({ id: dob.id, name: 'updated' });
				const savedDob = await repo.save(updatedDob);

				expect(savedDob).toBeInstanceOf(TestDO);
				expect(savedDob.getProps()).toEqual(updatedDob.getProps());
			});

			it('should take protected properties from entity', async () => {
				const { dob, entity } = await setup();
				const createdAt = new Date(0);
				const updatedAt = new Date(0);

				const updatedDob = new TestDO({ id: dob.id, name: 'updated', createdAt, updatedAt });

				const savedDob = await repo.save(updatedDob);

				const resultEntity = await em.findOne(TestEntity, { id: savedDob.id });

				expect(resultEntity).toBeInstanceOf(TestEntity);
				expect(resultEntity?.createdAt).toEqual(entity.createdAt);
				expect(resultEntity?.updatedAt).toEqual(entity.updatedAt);
			});
		});
	});

	describe('saveAll', () => {
		describe('when create multiple domain objects', () => {
			const setup = () => {
				const id1 = new ObjectId().toHexString();
				const id2 = new ObjectId().toHexString();
				const dobs = [new TestDO({ id: id1, name: 'test1' }), new TestDO({ id: id2, name: 'test2' })];
				const spyCreate = jest.spyOn(em, 'create');

				const expected = dobs.map((dob) => {
					const props = dob.getProps();
					return { _id: new ObjectId(props.id), name: props.name };
				});

				return { dobs, spyCreate, expected };
			};

			it('should call em.create with expected params', async () => {
				const { dobs, spyCreate, expected } = setup();

				const savedDobs = await repo.saveAll(dobs);

				expect(savedDobs).toHaveLength(dobs.length);
				savedDobs.forEach((savedDob, index) => {
					expect(savedDob.id).toEqual(expected[index]._id.toHexString());
					expect(spyCreate).toBeCalledWith(TestEntity, expected[index]);
				});
			});

			it('should save multiple domain objects', async () => {
				const { dobs } = setup();

				const savedDobs = await repo.saveAll(dobs);

				expect(savedDobs).toHaveLength(dobs.length);
				savedDobs.forEach((savedDob, index) => {
					expect(savedDob).toBeInstanceOf(TestDO);
					expect(savedDob.getProps()).toEqual(dobs[index].getProps());
				});
			});
		});

		describe('when update multiple domain objects', () => {
			const setup = async () => {
				const entities = [
					new TestEntity({ name: 'test1', id: new ObjectId().toHexString() }),
					new TestEntity({ name: 'test2', id: new ObjectId().toHexString() }),
				];
				await em.persistAndFlush(entities);

				const spyCreate = jest.spyOn(em, 'assign');

				const dobs = entities.map((entity, index) => new TestDO({ id: entity.id, name: `test${index}` }));

				const expected = dobs.map((dob) => {
					const props = dob.getProps();
					return { name: props.name };
				});
				return { entities, dobs, spyCreate, expected };
			};

			it('should call em.create', async () => {
				const { dobs, spyCreate, expected } = await setup();

				const savedDobs = await repo.saveAll(dobs);

				expect(savedDobs).toHaveLength(dobs.length);
				savedDobs.forEach((savedDob, index) => {
					expect(savedDob).toBeInstanceOf(TestDO);
					expect(spyCreate).toHaveBeenCalledWith(expect.any(TestEntity), expected[index]);
				});
			});

			it('should save multiple domain objects', async () => {
				const { dobs } = await setup();

				const savedDobs = await repo.saveAll(dobs);

				expect(savedDobs).toHaveLength(dobs.length);
				savedDobs.forEach((savedDob, index) => {
					expect(savedDob).toBeInstanceOf(TestDO);
					expect(savedDob.getProps()).toEqual(dobs[index].getProps());
				});
			});

			it('should update multiple domain objects', async () => {
				const { dobs } = await setup();

				const updatedDobs = dobs.map((dob) => new TestDO({ id: dob.id, name: 'updated' }));
				const savedDobs = await repo.saveAll(updatedDobs);

				expect(savedDobs).toHaveLength(updatedDobs.length);
				savedDobs.forEach((savedDob, index) => {
					expect(savedDob).toBeInstanceOf(TestDO);
					expect(savedDob.getProps()).toEqual(updatedDobs[index].getProps());
				});
			});
		});
	});

	describe('delete', () => {
		const setup = async () => {
			const entities = [
				new TestEntity({ name: 'test1', id: new ObjectId().toHexString() }),
				new TestEntity({ name: 'test2', id: new ObjectId().toHexString() }),
			];
			await em.persistAndFlush(entities);

			const dobs = entities.map((entity) => new TestDO({ id: entity.id, name: 'test' }));

			return { entities, dobs };
		};

		it('should delete a single domain object', async () => {
			const { dobs } = await setup();

			await repo.delete(dobs[0]);

			const entities = await em.find(TestEntity, {});
			expect(entities).toHaveLength(1);
			expect(entities[0].id).toEqual(dobs[1].id);
		});

		it('should delete multiple domain objects', async () => {
			const { dobs } = await setup();

			await repo.delete(dobs);

			const entities = await em.find(TestEntity, {});
			expect(entities).toHaveLength(0);
		});

		it('should throw error when id is not set', async () => {
			await setup();
			// @ts-expect-error - testing invalid input
			const notFoundDob = new TestDO({ name: 'test' });

			await expect(repo.delete(notFoundDob)).rejects.toThrowError('Cannot delete object without id');
		});
	});

	describe('findById', () => {
		const setup = async () => {
			const entity = new TestEntity({ name: 'test', id: new ObjectId().toHexString() });
			await em.persistAndFlush(entity);

			return { entity };
		};

		it('should find an entity by id', async () => {
			const { entity } = await setup();

			const foundEntity = await repo.findEntityById(entity.id);

			expect(foundEntity).toBeInstanceOf(TestEntity);
			expect(foundEntity.id).toEqual(entity.id);
		});
	});
});
