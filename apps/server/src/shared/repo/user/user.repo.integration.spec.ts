import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchCreator, SortOrder, System, User } from '@shared/domain';
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
			const result = await repo.findById(user.id);
			expect(Object.keys(result).sort()).toEqual(
				[
					'createdAt',
					'updatedAt',
					'roles',
					'firstName',
					'lastName',
					'email',
					'school',
					'_id',
					'ldapId',
					'forcePasswordChange',
					'preferences',
					'language',
				].sort()
			);
		});

		it('should return one role that matched by id', async () => {
			const userA = userFactory.build();
			const userB = userFactory.build();

			await em.persistAndFlush([userA, userB]);
			const result = await repo.findById(userA.id);
			expect(result).toEqual(userA);
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

			expect(result.roles.getItems()).toEqual(roles1);
			expect(result.roles[0].roles.getItems()).toEqual(roles2);
			expect(result.roles[0].roles[0].roles.getItems()).toEqual(roles3);
		});
	});

	describe('findByLdapId', () => {
		let sys: System;
		let userA: User;
		let userB: User;
		beforeEach(async () => {
			sys = systemFactory.build();
			await em.persistAndFlush([sys]);
			const school = schoolFactory.build({ systems: [sys] });
			// const school = schoolFactory.withSystem().build();

			userA = userFactory.build({ school, ldapId: '111' });
			userB = userFactory.build({ ldapId: '111' });
			await em.persistAndFlush([userA, userB]);
		});
		it('should return right keys', async () => {
			const result = await repo.findByLdapId(userA.ldapId as string, sys.id);
			expect(Object.keys(result).sort()).toEqual(
				[
					'createdAt',
					'updatedAt',
					'roles',
					'firstName',
					'lastName',
					'email',
					'school',
					'_id',
					'ldapId',
					'forcePasswordChange',
					'preferences',
					'language',
				].sort()
			);
		});

		it('should return user matched by id', async () => {
			await em.persistAndFlush([userA, userB]);
			const result = await repo.findByLdapId(userA.ldapId as string, sys.id);
			expect(result).toEqual(userA);
		});

		it('should throw an error if user by ldapid doesnt exist', async () => {
			const idA = new ObjectId().toHexString();
			const idB = new ObjectId().toHexString();

			await expect(repo.findByLdapId(idA, idB)).rejects.toThrow(NotFoundException);
		});
	});

	describe('findWithoutImportUser', () => {
		const persistUserAndSchool = async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			await em.persistAndFlush([user, school]);
			return { user, school };
		};

		it('should find users not referenced in importusers', async () => {
			const { user } = await persistUserAndSchool();
			const [result, count] = await repo.findWithoutImportUser(user.school);
			expect(result).toContain(user);
			expect(count).toEqual(1);
		});

		it('should exclude users referenced in importusers', async () => {
			const { user, school } = await persistUserAndSchool();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({ school });
			await em.persistAndFlush([user, importUser]);
			const [result, count] = await repo.findWithoutImportUser(user.school);
			expect(result).not.toContain(user);
			expect(count).toEqual(0);
		});

		it('should find users but exclude users referenced in importusers ', async () => {
			const { user, school } = await persistUserAndSchool();
			const matchedUser = userFactory.build({ school });
			const importUser = importUserFactory.matched(MatchCreator.AUTO, matchedUser).build({ school });
			await em.persistAndFlush([matchedUser, importUser]);
			const [result, count] = await repo.findWithoutImportUser(school);
			expect(result).toContain(user);
			expect(result).not.toContain(matchedUser);
			expect(count).toEqual(1);
		});

		it('should filter users by firstName contains or lastName contains, ignore case', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ firstName: 'Papa', lastName: 'Pane', school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			// full first name
			const [result1, count1] = await repo.findWithoutImportUser(school, { name: 'papa' });
			expect(result1).toContain(user);
			expect(result1).not.toContain(otherUser);
			expect(count1).toEqual(1);
			// full last name
			const [result2, count2] = await repo.findWithoutImportUser(school, { name: 'pane' });
			expect(result2).toContain(user);
			expect(result2).not.toContain(otherUser);
			expect(count2).toEqual(1);
			// partial first and last name
			const [result3, count3] = await repo.findWithoutImportUser(school, { name: 'pa' });
			expect(result3).toContain(user);
			expect(result3).not.toContain(otherUser);
			expect(count3).toEqual(1);
			// partial first name
			const [result4, count4] = await repo.findWithoutImportUser(school, { name: 'pap' });
			expect(result4).toContain(user);
			expect(result4).not.toContain(otherUser);
			expect(count4).toEqual(1);
			// partial last name
			const [result5, count5] = await repo.findWithoutImportUser(school, { name: 'ane' });
			expect(result5).toContain(user);
			expect(result5).not.toContain(otherUser);
			expect(count5).toEqual(1);
			// no match
			const [result6, count6] = await repo.findWithoutImportUser(school, { name: 'Fox' });
			expect(result6).not.toContain(user);
			expect(result6).not.toContain(otherUser);
			expect(count6).toEqual(0);
		});

		it('should sort returned users by firstname, lastname', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school, firstName: 'Anna', lastName: 'Schmidt' });
			const otherUser = userFactory.build({ school, firstName: 'Peter', lastName: 'Ball' });
			await em.persistAndFlush([user, otherUser]);
			const [result, count] = await repo.findWithoutImportUser(school, undefined, {
				order: { firstName: SortOrder.desc },
			});
			expect(count).toEqual(2);
			expect(result.indexOf(user)).toEqual(1);
			expect(result.indexOf(otherUser)).toEqual(0);

			const [result2, count2] = await repo.findWithoutImportUser(school, undefined, {
				order: { firstName: SortOrder.asc },
			});
			expect(count2).toEqual(2);
			expect(result2.indexOf(user)).toEqual(0);
			expect(result2.indexOf(otherUser)).toEqual(1);

			const [result3, count3] = await repo.findWithoutImportUser(school, undefined, {
				order: { lastName: SortOrder.desc },
			});
			expect(count3).toEqual(2);
			expect(result3.indexOf(user)).toEqual(0);
			expect(result3.indexOf(otherUser)).toEqual(1);

			const [result4, count4] = await repo.findWithoutImportUser(school, undefined, {
				order: { lastName: SortOrder.asc },
			});
			expect(count4).toEqual(2);
			expect(result4.indexOf(user)).toEqual(1);
			expect(result4.indexOf(otherUser)).toEqual(0);
		});

		it('should skip returned two users by one', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			const [result, count] = await repo.findWithoutImportUser(school, undefined, { pagination: { skip: 1 } });
			expect(result).not.toContain(user);
			expect(result).toContain(otherUser);
			expect(result.length).toEqual(1);
			expect(count).toEqual(2);
		});

		it('should limit returned users from two to one', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			const [result, count] = await repo.findWithoutImportUser(school, undefined, { pagination: { limit: 1 } });
			expect(result).toContain(user);
			expect(result).not.toContain(otherUser);
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
