import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { type SystemEntity } from '@modules/system/entity';
import { Test, TestingModule } from '@nestjs/testing';

import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { SchoolEntity } from '@shared/domain/entity';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { cleanupCollections, schoolEntityFactory, systemEntityFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { userLoginMigrationFactory } from '../../testing';
import { UserLoginMigrationRepo } from './user-login-migration.repo';

describe('UserLoginMigrationRepo', () => {
	let module: TestingModule;
	let repo: UserLoginMigrationRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserLoginMigrationRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		repo = module.get(UserLoginMigrationRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
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

				await em.persistAndFlush([school, sourceSystem, targetSystem]);
				em.clear();

				return {
					domainObject,
				};
			};

			it('should save a UserLoginMigration to the database', async () => {
				const { domainObject } = await setup();
				const { id, ...expected } = domainObject;

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

				const result = em.find(UserLoginMigrationEntity, { id: domainObject.id });
				expect(result).toBeDefined();
			});
		});
	});

	describe('delete', () => {
		describe('when saving a UserLoginMigrationDO', () => {
			const setup = async () => {
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId();

				await em.persistAndFlush(userLoginMigration);
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

				await em.persistAndFlush(userLoginMigration);
				em.clear();

				const domainObject: UserLoginMigrationDO = repo.mapEntityToDO(userLoginMigration);

				return {
					userLoginMigration,
					domainObject,
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

				await em.persistAndFlush(school);
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
