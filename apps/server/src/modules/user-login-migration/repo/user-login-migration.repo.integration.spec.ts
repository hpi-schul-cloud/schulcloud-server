import { wrap } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { SystemEntity } from '@modules/system/repo';
import { systemEntityFactory } from '@modules/system/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { UserLoginMigrationDO } from '../domain';
import { userLoginMigrationFactory } from '../testing';
import { UserLoginMigrationEntity } from './user-login-migration.entity';
import { UserLoginMigrationRepo } from './user-login-migration.repo';

describe('UserLoginMigrationRepo', () => {
	let module: TestingModule;
	let repo: UserLoginMigrationRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [UserLoginMigrationEntity] })],
			providers: [UserLoginMigrationRepo],
		}).compile();

		repo = module.get(UserLoginMigrationRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		em.clear();
		await cleanupCollections(em);
	});

	describe('relation nullability', () => {
		it('should explicitly allow an absent inverse migration while requiring the owning school', () => {
			const schoolMetadata = em.getMetadata().get(SchoolEntity);
			const migrationMetadata = em.getMetadata().get(UserLoginMigrationEntity);

			expect(schoolMetadata.properties.userLoginMigration).toMatchObject({
				nullable: true,
				owner: false,
				orphanRemoval: true,
			});
			expect(migrationMetadata.properties.school).toMatchObject({ nullable: false, owner: true });
			expect(migrationMetadata.properties.sourceSystem.nullable).toBe(true);
			expect(migrationMetadata.properties.targetSystem.nullable).not.toBe(true);
		});

		it.each(['missing', 'null'] as const)(
			'should hydrate and map an optional source from a %s BSON field',
			async (source) => {
				const migration = userLoginMigrationFactory.buildWithId();
				await em.persist(migration).flush();
				const collection = em.getCollection<{ _id: ObjectId; sourceSystem?: ObjectId | null }>(
					em.getMetadata().get(UserLoginMigrationEntity).collection
				);
				const filter = { _id: new ObjectId(migration.id) };
				if (source === 'null') {
					await collection.updateOne(filter, { $set: { sourceSystem: null } });
				}
				em.clear();

				const loaded = await em.findOneOrFail(UserLoginMigrationEntity, migration.id);
				expect(loaded.sourceSystem).toBe(source === 'null' ? null : undefined);
				expect(wrap(loaded).toObject().sourceSystem).toBe(source === 'null' ? null : undefined);
				expect(repo.mapEntityToDO(loaded).sourceSystemId).toBeUndefined();
			}
		);

		it('should persist removal of a source system without deleting the system', async () => {
			const sourceSystem = systemEntityFactory.buildWithId();
			const migration = userLoginMigrationFactory.buildWithId({ sourceSystem });
			await em.persist(migration).flush();
			em.clear();

			const loaded = await em.findOneOrFail(UserLoginMigrationEntity, migration.id);
			loaded.sourceSystem = undefined;
			await em.flush();
			em.clear();

			const reloaded = await em.findOneOrFail(UserLoginMigrationEntity, migration.id);
			expect(reloaded.sourceSystem).toBeUndefined();
			expect(repo.mapEntityToDO(reloaded).sourceSystemId).toBeUndefined();
			expect(
				(await em.getCollection(UserLoginMigrationEntity).findOne({ _id: new ObjectId(migration.id) }))?.sourceSystem
			).toBeUndefined();
			await em.findOneOrFail(SystemEntity, sourceSystem.id);
		});

		it('should remove an orphaned migration without deleting its school or target system', async () => {
			const migration = userLoginMigrationFactory.buildWithId();
			await em.persist(migration).flush();
			em.clear();

			const school = await em.findOneOrFail(SchoolEntity, migration.school.id);
			expect(school.userLoginMigration?.id).toBe(migration.id);
			school.userLoginMigration = undefined;
			await em.flush();
			em.clear();

			expect(await em.findOne(UserLoginMigrationEntity, migration.id)).toBeNull();
			const reloaded = await em.findOneOrFail(SchoolEntity, school.id);
			expect(reloaded.userLoginMigration).toBeUndefined();
			await em.findOneOrFail(SystemEntity, migration.targetSystem.id);
		});
	});

	describe('save', () => {
		describe('when saving a UserLoginMigrationDO', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();
				const targetSystem: SystemEntity = systemEntityFactory.buildWithId();

				const domainObject: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: school.id,
					sourceSystemId: sourceSystem.id,
					targetSystemId: targetSystem.id,
					mandatorySince: new Date('2023-04-24'),
					startedAt: new Date('2023-04-25'),
					closedAt: new Date('2023-04-26'),
					finishedAt: new Date('2023-04-27'),
				});

				await em.persist([school, sourceSystem, targetSystem]).flush();
				em.clear();

				return {
					domainObject,
				};
			};

			it('should save a UserLoginMigration to the database', async () => {
				const { domainObject } = await setup();
				const expected = { ...domainObject };
				delete expected.id;

				const result: UserLoginMigrationDO = await repo.save(domainObject);

				expect(result).toMatchObject(expected);
				expect(result.id).toBeDefined();
			});

			it('should be able to update a UserLoginMigration to the database', async () => {
				const { domainObject } = await setup();

				await repo.save(domainObject);
				em.clear();

				domainObject.mandatorySince = new Date();
				await repo.save(domainObject);

				const result = await em.findOne(UserLoginMigrationEntity, { id: domainObject.id });
				expect(result).toBeDefined();
			});
		});
	});

	describe('delete', () => {
		describe('when saving a UserLoginMigrationDO', () => {
			const setup = async () => {
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId();

				await em.persist(userLoginMigration).flush();
				em.clear();

				const domainObject: UserLoginMigrationDO = repo.mapEntityToDO(userLoginMigration);

				return {
					userLoginMigration,
					domainObject,
				};
			};

			it('should not delete the school', async () => {
				const { domainObject, userLoginMigration } = await setup();
				const { school } = userLoginMigration;

				await repo.delete(domainObject);

				await em.findOneOrFail(SchoolEntity, { id: school.id });
			});
		});
	});

	describe('findBySchoolId', () => {
		describe('when searching for a UserLoginMigration by its school id', () => {
			const setup = async () => {
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId();

				await em.persist(userLoginMigration).flush();
				em.clear();
				return {
					userLoginMigration,
					domainObject: repo.mapEntityToDO(userLoginMigration),
				};
			};

			it('should return the UserLoginMigration', async () => {
				const { domainObject, userLoginMigration } = await setup();

				const result: UserLoginMigrationDO | null = await repo.findBySchoolId(userLoginMigration.school.id);

				expect(result).toEqual(domainObject);
			});
		});

		describe('when searching for a UserLoginMigration by an unknown school id', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId({ userLoginMigration: undefined });

				await em.persist(school).flush();
				em.clear();

				return {
					school,
				};
			};

			it('should return null', async () => {
				const { school } = await setup();

				const result: UserLoginMigrationDO | null = await repo.findBySchoolId(school.id);

				expect(result).toBeNull();
			});
		});
	});
});
