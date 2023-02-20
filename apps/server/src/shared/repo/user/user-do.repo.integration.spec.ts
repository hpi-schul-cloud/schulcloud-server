import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { NotFoundError } from '@mikro-orm/core';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { IUserProperties, LanguageType, Role, School, System, User } from '@shared/domain';

class UserRepoSpec extends UserDORepo {
	mapEntityToDOSpec(entity: User): UserDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntityPropertiesSpec(entityDO: UserDO): IUserProperties {
		return super.mapDOToEntityProperties(entityDO);
	}
}

describe('UserRepo', () => {
	let module: TestingModule;
	let repo: UserRepoSpec;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserRepoSpec,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		repo = module.get(UserRepoSpec);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});

	describe('entityFactory', () => {
		const props: IUserProperties = {
			email: 'email@email.email',
			firstName: 'firstName',
			lastName: 'lastName',
			school: schoolFactory.buildWithId(),
			roles: [roleFactory.buildWithId()],
		};

		it('should return new entity of type User', () => {
			const result: User = repo.entityFactory(props);

			expect(result).toBeInstanceOf(User);
		});

		it('should return new entity with values from properties', () => {
			const result: User = repo.entityFactory(props);

			expect(result).toEqual(
				expect.objectContaining({
					email: props.email,
					firstName: props.firstName,
					lastName: props.lastName,
					school: props.school,
				})
			);
			expect(result.roles.getItems()).toEqual(props.roles);
		});
	});

	describe('findById', () => {
		it('should find user without populating roles', async () => {
			const user: User = userFactory.buildWithId();

			await em.persistAndFlush(user);

			const result: UserDO = await repo.findById(user.id);

			expect(result.id).toEqual(user.id);
			expect(result.roleIds).toEqual([]);
		});

		it('should find user and populate roles', async () => {
			const roles3: Role[] = roleFactory.buildList(1);
			await em.persistAndFlush(roles3);

			const roles2: Role[] = roleFactory.buildList(1, { roles: roles3 });
			await em.persistAndFlush(roles2);

			const roles1: Role[] = roleFactory.buildList(1, { roles: roles2 });
			await em.persistAndFlush(roles1);

			const user: User = userFactory.build({ roles: roles1 });
			await em.persistAndFlush([user]);

			em.clear();

			const result: UserDO = await repo.findById(user.id, true);

			expect(result.id).toEqual(user.id);
			expect(result.roleIds).toEqual([roles1[0].id]);
		});

		it('should throw if user cannot be found', async () => {
			await expect(repo.findById(new ObjectId().toHexString(), false)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByExternalId', () => {
		const externalId = 'externalId';
		let system: System;
		let school: School;
		let user: User;

		beforeEach(async () => {
			system = systemFactory.buildWithId();
			school = schoolFactory.buildWithId();
			school.systems.add(system);
			user = userFactory.buildWithId({ externalId, school });

			await em.persistAndFlush([user, system, school]);
		});

		it('should find a user by its external id', async () => {
			const result: UserDO | null = await repo.findByExternalId(user.externalId as string, system.id);

			expect(result).toEqual(
				expect.objectContaining({
					id: user.id,
					externalId: user.externalId,
					schoolId: school.id,
				})
			);
		});

		it('should return null if no user with external id was found', async () => {
			await em.nativeDelete(User, {});

			const result: UserDO | null = await repo.findByExternalId(user.externalId as string, system.id);

			expect(result).toBeNull();
		});

		it('should return null if school has no corresponding system', async () => {
			school.systems.removeAll();

			const result: UserDO | null = await repo.findByExternalId(user.externalId as string, system.id);

			expect(result).toBeNull();
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			const id = new ObjectId();
			const testEntity: User = userFactory.buildWithId(
				{
					email: 'email@email.email',
					firstName: 'firstName',
					lastName: 'lastName',
					school: schoolFactory.buildWithId(),
					ldapDn: 'ldapDn',
					externalId: 'externalId',
					language: LanguageType.DE,
					forcePasswordChange: false,
					preferences: { firstLogin: true },
				},
				id.toHexString()
			);
			const role: Role = roleFactory.buildWithId();
			testEntity.roles.add(role);
			testEntity.firstNameSearchValues = ['em'];
			testEntity.lastNameSearchValues = ['em'];
			testEntity.emailSearchValues = ['em'];
			testEntity.importHash = 'importHash';
			testEntity.outdatedSince = new Date();
			testEntity.lastLoginSystemChange = new Date();
			testEntity.previousExternalId = 'someId';

			const userDO: UserDO = repo.mapEntityToDOSpec(testEntity);

			expect(userDO).toEqual(
				expect.objectContaining({
					id: testEntity.id,
					updatedAt: testEntity.updatedAt,
					createdAt: testEntity.createdAt,
					email: testEntity.email,
					firstName: testEntity.firstName,
					lastName: testEntity.lastName,
					schoolId: testEntity.school.id,
					roleIds: [role.id],
					ldapDn: testEntity.ldapDn,
					externalId: testEntity.externalId,
					importHash: testEntity.importHash,
					firstNameSearchValues: testEntity.firstNameSearchValues,
					lastNameSearchValues: testEntity.lastNameSearchValues,
					emailSearchValues: testEntity.emailSearchValues,
					language: testEntity.language,
					forcePasswordChange: testEntity.forcePasswordChange,
					preferences: testEntity.preferences,
					outdatedSince: testEntity.outdatedSince,
					lastLoginSystemChange: testEntity.lastLoginSystemChange,
					previousExternalId: testEntity.previousExternalId,
				})
			);
		});
	});

	describe('mapDOToEntityProperties', () => {
		it('should map DO to Entity Properties', () => {
			const testDO: UserDO = new UserDO({
				id: 'testId',
				email: 'email@email.email',
				firstName: 'firstName',
				lastName: 'lastName',
				roleIds: [new ObjectId().toHexString()],
				schoolId: new ObjectId().toHexString(),
				ldapDn: 'ldapDn',
				externalId: 'externalId',
				language: LanguageType.DE,
				forcePasswordChange: false,
				preferences: { firstLogin: true },
				outdatedSince: new Date(),
				lastLoginSystemChange: new Date(),
				previousExternalId: 'someId',
			});

			const result: IUserProperties = repo.mapDOToEntityPropertiesSpec(testDO);

			expect(result).toEqual(
				expect.objectContaining({
					email: testDO.email,
					firstName: testDO.firstName,
					lastName: testDO.lastName,
					school: { id: testDO.schoolId },
					roles: [{ id: testDO.roleIds[0] }],
					ldapDn: testDO.ldapDn,
					externalId: testDO.externalId,
					language: testDO.language,
					forcePasswordChange: testDO.forcePasswordChange,
					preferences: testDO.preferences,
					outdatedSince: testDO.outdatedSince,
					lastLoginSystemChange: testDO.lastLoginSystemChange,
					previousExternalId: testDO.previousExternalId,
				})
			);
		});
	});
});
