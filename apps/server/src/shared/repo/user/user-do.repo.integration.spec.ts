import { EntityProperties } from '@shared/repo';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { NotFoundError } from '@mikro-orm/core';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { IUserProperties, LanguageType, Role, School, System, User } from '@shared/domain/index';

class UserRepoSpec extends UserDORepo {
	mapEntityToDOSpec(entity: User): UserDO {
		return super.mapEntityToDO(entity);
	}

	mapDOToEntitySpec(entityDO: UserDO): EntityProperties<IUserProperties> {
		return super.mapDOToEntity(entityDO);
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

	it('should implement getConstructor', () => {
		expect(repo.getConstructor()).toBe(User);
	});

	describe('findById', () => {
		it('should find user without populating roles', async () => {
			// Arrange
			const user: User = userFactory.buildWithId();

			await em.persistAndFlush(user);

			// Act
			const result: UserDO = await repo.findById(user.id);

			// Assert
			expect(result.id).toEqual(user.id);
			expect(result.roleIds).toEqual([]);
		});

		it('should find user and populate roles', async () => {
			// Arrange
			const roles3: Role[] = roleFactory.buildList(1);
			await em.persistAndFlush(roles3);

			const roles2: Role[] = roleFactory.buildList(1, { roles: roles3 });
			await em.persistAndFlush(roles2);

			const roles1: Role[] = roleFactory.buildList(1, { roles: roles2 });
			await em.persistAndFlush(roles1);

			const user: User = userFactory.build({ roles: roles1 });
			await em.persistAndFlush([user]);

			em.clear();

			// Act
			const result: UserDO = await repo.findById(user.id, true);

			// Assert
			expect(result.id).toEqual(user.id);
			expect(result.roleIds).toEqual([roles1[0].id]);
		});

		it('should throw if user cannot be found', async () => {
			// Act & Assert
			await expect(repo.findById(new ObjectId().toHexString(), false)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findByExternalIdOrFail', () => {
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
			// Act
			const result: UserDO = await repo.findByExternalIdOrFail(user.externalId as string, system.id);

			// Assert
			expect(result.id).toEqual(user.id);
			expect(result.externalId).toEqual(user.externalId);
			expect(result.schoolId).toEqual(school.id);
		});

		it('should reject if no user with external id was found', async () => {
			// Arrange
			await em.nativeDelete(User, {});

			// Act & Assert
			await expect(repo.findByExternalIdOrFail(user.externalId as string, system.id)).rejects.toThrow(NotFoundError);
		});

		it('should reject if school has no corresponding system', async () => {
			// Arrange
			school.systems.removeAll();

			// Act & Assert
			await expect(repo.findByExternalIdOrFail(user.externalId as string, system.id)).rejects.toThrow(NotFoundError);
		});
	});

	describe('mapEntityToDO', () => {
		it('should return a domain object', () => {
			// Arrange
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

			// Act
			const userDO: UserDO = repo.mapEntityToDOSpec(testEntity);

			// Assert
			expect(userDO.id).toEqual(testEntity.id);
			expect(userDO.updatedAt).toEqual(testEntity.updatedAt);
			expect(userDO.createdAt).toEqual(testEntity.createdAt);
			expect(userDO.email).toEqual(testEntity.email);
			expect(userDO.firstName).toEqual(testEntity.firstName);
			expect(userDO.lastName).toEqual(testEntity.lastName);
			expect(userDO.schoolId).toEqual(testEntity.school.id);
			expect(userDO.roleIds[0]).toEqual(role.id);
			expect(userDO.ldapDn).toEqual(testEntity.ldapDn);
			expect(userDO.externalId).toEqual(testEntity.externalId);
			expect(userDO.importHash).toEqual(testEntity.importHash);
			expect(userDO.firstNameSearchValues).toEqual(testEntity.firstNameSearchValues);
			expect(userDO.lastNameSearchValues).toEqual(testEntity.lastNameSearchValues);
			expect(userDO.emailSearchValues).toEqual(testEntity.emailSearchValues);
			expect(userDO.language).toEqual(testEntity.language);
			expect(userDO.forcePasswordChange).toEqual(testEntity.forcePasswordChange);
			expect(userDO.preferences).toEqual(testEntity.preferences);
		});
	});

	describe('mapDOToEntity', () => {
		it('should map DO to Entity', () => {
			// Arrange
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
			});

			// Act
			const result: EntityProperties<IUserProperties> = repo.mapDOToEntitySpec(testDO);

			// Assert
			expect(result.id).toEqual(testDO.id);
			expect(result.email).toEqual(testDO.email);
			expect(result.firstName).toEqual(testDO.firstName);
			expect(result.lastName).toEqual(testDO.lastName);
			expect((result.roles[0] as Role).id).toEqual(testDO.roleIds[0]);
			expect(result.school.id).toEqual(testDO.schoolId);
			expect(result.ldapDn).toEqual(testDO.ldapDn);
			expect(result.externalId).toEqual(testDO.externalId);
			expect(result.language).toEqual(testDO.language);
			expect(result.forcePasswordChange).toEqual(testDO.forcePasswordChange);
			expect(result.preferences).toEqual(testDO.preferences);
		});
	});
});
