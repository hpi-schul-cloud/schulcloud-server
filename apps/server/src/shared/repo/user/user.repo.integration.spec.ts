import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchCreator, SortOrder, SystemEntity, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, importUserFactory, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { UserRepo } from './user.repo';

describe('user repo', () => {
	let module: TestingModule;
	let repo: UserRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [UserRepo],
		}).compile();
		repo = module.get(UserRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		em.clear();
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(User);
	});

	describe('findById', () => {
		it('should return right keys', async () => {
			const user = userFactory.build();

			await em.persistAndFlush([user]);
			em.clear();

			const result = await repo.findById(user.id);
			expect(Object.keys(result).sort()).toEqual(
				[
					'createdAt',
					'updatedAt',
					'roles',
					'firstName',
					'firstNameSearchValues',
					'lastName',
					'lastNameSearchValues',
					'email',
					'emailSearchValues',
					'school',
					'_id',
					'ldapDn',
					'externalId',
					'forcePasswordChange',
					'importHash',
					'preferences',
					'language',
					'deletedAt',
					'lastLoginSystemChange',
					'outdatedSince',
					'previousExternalId',
				].sort()
			);
		});

		it('should return one role that matched by id', async () => {
			const userA = userFactory.build();
			const userB = userFactory.build();

			await em.persistAndFlush([userA, userB]);
			em.clear();

			const result = await repo.findById(userA.id);
			expect(result).toMatchObject({
				id: userA.id,
				firstName: userA.firstName,
				lastName: userA.lastName,
				email: userA.email,
			});
		});

		it('should throw an error if roles by id doesnt exist', async () => {
			const idA = new ObjectId().toHexString();

			await expect(repo.findById(idA)).rejects.toThrow(NotFoundError);
		});

		it('should populate user roles recursively if requested', async () => {
			const roles3 = roleFactory.buildList(1);
			await em.persistAndFlush(roles3);

			const roles2 = roleFactory.buildList(1, { roles: roles3 });
			await em.persistAndFlush(roles2);

			const roles1 = roleFactory.buildList(1, { roles: roles2 });
			await em.persistAndFlush(roles1);

			const user = userFactory.build({ roles: roles1 });
			await em.persistAndFlush([user]);
			em.clear();

			const result = await repo.findById(user.id, true);

			expect(result.roles.toArray()).toEqual(user.roles.toArray());
			expect(result.roles[0].roles.toArray()).toEqual(user.roles[0].roles.toArray());
			expect(result.roles[0].roles[0].roles.toArray()).toEqual(user.roles[0].roles[0].roles.toArray());
		});
	});

	describe('findByExternalIdorFail', () => {
		let sys: SystemEntity;
		let userA: User;
		let userB: User;
		beforeEach(async () => {
			sys = systemFactory.build();
			await em.persistAndFlush([sys]);
			const school = schoolFactory.build({ systems: [sys] });
			// const school = schoolFactory.withSystem().build();

			userA = userFactory.build({ school, externalId: '111' });
			userB = userFactory.build({ externalId: '111' });
			await em.persistAndFlush([userA, userB]);
			em.clear();
		});
		it('should return right keys', async () => {
			const result = await repo.findByExternalIdOrFail(userA.externalId as string, sys.id);
			expect(Object.keys(result).sort()).toEqual(
				[
					'createdAt',
					'updatedAt',
					'roles',
					'firstName',
					'firstNameSearchValues',
					'lastName',
					'lastNameSearchValues',
					'email',
					'emailSearchValues',
					'school',
					'_id',
					'ldapDn',
					'externalId',
					'forcePasswordChange',
					'importHash',
					'preferences',
					'language',
					'deletedAt',
					'lastLoginSystemChange',
					'outdatedSince',
					'previousExternalId',
				].sort()
			);
		});

		it('should return user matched by id', async () => {
			const result = await repo.findByExternalIdOrFail(userA.externalId as string, sys.id);
			expect(result).toMatchObject({
				id: userA.id,
				firstName: userA.firstName,
				lastName: userA.lastName,
				email: userA.email,
			});
		});

		it('should throw an error if user by externalid doesnt exist', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();
			await expect(repo.findByExternalIdOrFail(idA, idB)).rejects.toEqual(undefined);
		});
	});

	describe('findWithoutImportUser', () => {
		const persistUserAndSchool = async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			await em.persistAndFlush([user, school]);
			em.clear();
			return { user, school };
		};

		it('should find users not referenced in importusers', async () => {
			const { user } = await persistUserAndSchool();
			const [result, count] = await repo.findWithoutImportUser(user.school);
			expect(result.map((u) => u.id)).toContain(user.id);
			expect(count).toEqual(1);
		});

		it('should exclude users referenced in importusers', async () => {
			const { user, school } = await persistUserAndSchool();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({ school });
			await em.persistAndFlush([user, importUser]);
			em.clear();
			const [result, count] = await repo.findWithoutImportUser(user.school);
			expect(result).not.toContain(user);
			expect(count).toEqual(0);
		});

		it('should find users but exclude users referenced in importusers ', async () => {
			const { user, school } = await persistUserAndSchool();
			const matchedUser = userFactory.build({ school });
			const importUser = importUserFactory.matched(MatchCreator.AUTO, matchedUser).build({ school });
			await em.persistAndFlush([matchedUser, importUser]);
			em.clear();
			const [result, count] = await repo.findWithoutImportUser(school);
			expect(result.map((u) => u.id)).toContain(user.id);
			expect(result.map((u) => u.id)).not.toContain(matchedUser);
			expect(count).toEqual(1);
		});

		it('should exclude deleted users', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school, deletedAt: new Date() });
			await em.persistAndFlush([school, user]);
			em.clear();
			const [result, count] = await repo.findWithoutImportUser(school);
			expect(result.map((u) => u.id)).not.toContain(user.id);
			expect(count).toEqual(0);
		});

		it('should filter users by firstName contains or lastName contains, ignore case', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ firstName: 'Papa', lastName: 'Pane', school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			em.clear();
			// full first name
			const [result1, count1] = await repo.findWithoutImportUser(school, { name: 'papa' });
			expect(result1.map((u) => u.id)).toContain(user.id);
			expect(result1.map((u) => u.id)).not.toContain(otherUser.id);
			expect(count1).toEqual(1);
			// full last name
			const [result2, count2] = await repo.findWithoutImportUser(school, { name: 'pane' });
			expect(result2.map((u) => u.id)).toContain(user.id);
			expect(result2.map((u) => u.id)).not.toContain(otherUser.id);
			expect(count2).toEqual(1);
			// partial first and last name
			const [result3, count3] = await repo.findWithoutImportUser(school, { name: 'pa' });
			expect(result3.map((u) => u.id)).toContain(user.id);
			expect(result3.map((u) => u.id)).not.toContain(otherUser.id);
			expect(count3).toEqual(1);
			// partial first name
			const [result4, count4] = await repo.findWithoutImportUser(school, { name: 'pap' });
			expect(result4.map((u) => u.id)).toContain(user.id);
			expect(result4.map((u) => u.id)).not.toContain(otherUser.id);
			expect(count4).toEqual(1);
			// partial last name
			const [result5, count5] = await repo.findWithoutImportUser(school, { name: 'ane' });
			expect(result5.map((u) => u.id)).toContain(user.id);
			expect(result5.map((u) => u.id)).not.toContain(otherUser.id);
			expect(count5).toEqual(1);
			// no match
			const [result6, count6] = await repo.findWithoutImportUser(school, { name: 'Fox' });
			expect(result6.map((u) => u.id)).not.toContain(user);
			expect(result6.map((u) => u.id)).not.toContain(otherUser);
			expect(count6).toEqual(0);
		});

		it('should sort returned users by firstname, lastname', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school, firstName: 'Anna', lastName: 'Schmidt' });
			const otherUser = userFactory.build({ school, firstName: 'Peter', lastName: 'Ball' });
			await em.persistAndFlush([user, otherUser]);
			em.clear();
			const [result, count] = await repo.findWithoutImportUser(school, undefined, {
				order: { firstName: SortOrder.desc },
			});
			expect(count).toEqual(2);
			expect(result.map((u) => u.id).indexOf(user.id)).toEqual(1);
			expect(result.map((u) => u.id).indexOf(otherUser.id)).toEqual(0);

			const [result2, count2] = await repo.findWithoutImportUser(school, undefined, {
				order: { firstName: SortOrder.asc },
			});
			expect(count2).toEqual(2);
			expect(result2.map((u) => u.id).indexOf(user.id)).toEqual(0);
			expect(result2.map((u) => u.id).indexOf(otherUser.id)).toEqual(1);

			const [result3, count3] = await repo.findWithoutImportUser(school, undefined, {
				order: { lastName: SortOrder.desc },
			});
			expect(count3).toEqual(2);
			expect(result3.map((u) => u.id).indexOf(user.id)).toEqual(0);
			expect(result3.map((u) => u.id).indexOf(otherUser.id)).toEqual(1);

			const [result4, count4] = await repo.findWithoutImportUser(school, undefined, {
				order: { lastName: SortOrder.asc },
			});
			expect(count4).toEqual(2);
			expect(result4.map((u) => u.id).indexOf(user.id)).toEqual(1);
			expect(result4.map((u) => u.id).indexOf(otherUser.id)).toEqual(0);
		});

		it('should skip returned two users by one', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			em.clear();
			const [result, count] = await repo.findWithoutImportUser(school, undefined, { pagination: { skip: 1 } });
			expect(result.map((u) => u.id)).not.toContain(user.id);
			expect(result.map((u) => u.id)).toContain(otherUser.id);
			expect(result.length).toEqual(1);
			expect(count).toEqual(2);
		});

		it('should limit returned users from two to one', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			em.clear();
			const [result, count] = await repo.findWithoutImportUser(school, undefined, { pagination: { limit: 1 } });
			expect(result.map((u) => u.id)).toContain(user.id);
			expect(result.map((u) => u.id)).not.toContain(otherUser.id);
			expect(result.length).toEqual(1);
			expect(count).toEqual(2);
		});

		it('should throw an error by passing invalid schoolId', async () => {
			const school = schoolFactory.build();
			// id do not exist
			await expect(repo.findWithoutImportUser(school)).rejects.toThrowError();
		});
	});

	describe('findByEmail', () => {
		it('should find user by email', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const user = userFactory.build({ email: originalUsername });
			await em.persistAndFlush([user]);
			em.clear();

			const result = await repo.findByEmail('USER@EXAMPLE.COM');
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(expect.objectContaining({ email: originalUsername }));
		});

		it('should find user by email, ignoring case', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const user = userFactory.build({ email: originalUsername });
			await em.persistAndFlush([user]);
			em.clear();

			let result: User[];

			result = await repo.findByEmail('USER@example.COM');
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(expect.objectContaining({ email: originalUsername }));

			result = await repo.findByEmail('user@example.com');
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(expect.objectContaining({ email: originalUsername }));
		});

		it('should not find by wildcard', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const user = userFactory.build({ email: originalUsername });
			await em.persistAndFlush([user]);
			em.clear();

			let result: User[];

			result = await repo.findByEmail('USER@EXAMPLECCOM');
			expect(result).toHaveLength(0);

			result = await repo.findByEmail('.*');
			expect(result).toHaveLength(0);
		});
	});

	describe('saveWithoutFlush', () => {
		it('should add a user to the persist stack', () => {
			const user = userFactory.build();

			repo.saveWithoutFlush(user);
			expect(em.getUnitOfWork().getPersistStack().size).toBe(1);
		});
	});

	describe('flush', () => {
		it('should flush after save', async () => {
			const user = userFactory.build();
			em.persist(user);

			expect(user.id).toBeNull();

			await repo.flush();

			expect(user.id).not.toBeNull();
		});
	});
});
