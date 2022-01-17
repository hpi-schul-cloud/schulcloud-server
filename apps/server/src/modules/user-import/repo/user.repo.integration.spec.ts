import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchCreator, SortOrder, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { importUserFactory, schoolFactory, userFactory } from '@shared/testing';
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

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findById).toEqual('function');
	});
	describe('findWithoutImportUser', () => {
		beforeEach(async () => {
			await em.nativeDelete(User, {});
		});

		it('should find users not referenced in importusers', async () => {
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const result = await repo.findWithoutImportUser(user.school);
			expect(result).toContain(user);
		});

		it('should exclude users referenced in importusers', async () => {
			const user = userFactory.build();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build();
			await em.persistAndFlush([user, importUser]);
			const result = await repo.findWithoutImportUser(user.school);
			expect(result).not.toContain(user);
		});

		it('should find users but exclude users referenced in importusers ', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const matchedUser = userFactory.build({ school });
			const importUser = importUserFactory.matched(MatchCreator.AUTO, matchedUser).build();
			await em.persistAndFlush([user, importUser]);
			const result = await repo.findWithoutImportUser(school);
			expect(result).toContain(user);
			expect(result).not.toContain(matchedUser);
		});

		it('should filter users by firstName contains or lastName contains, ignore case', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ firstName: 'Papa', lastName: 'Pane', school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			// full first name
			const result1 = await repo.findWithoutImportUser(school, { fullName: 'papa' });
			expect(result1).toContain(user);
			expect(result1).not.toContain(otherUser);
			// full last name
			const result2 = await repo.findWithoutImportUser(school, { fullName: 'pane' });
			expect(result2).toContain(user);
			expect(result2).not.toContain(otherUser);
			// partial first and last name
			const result3 = await repo.findWithoutImportUser(school, { fullName: 'pa' });
			expect(result3).toContain(user);
			expect(result3).not.toContain(otherUser);
			// partial first name
			const result4 = await repo.findWithoutImportUser(school, { fullName: 'pap' });
			expect(result4).toContain(user);
			expect(result4).not.toContain(otherUser);
			// partial last name
			const result5 = await repo.findWithoutImportUser(school, { fullName: 'ane' });
			expect(result5).toContain(user);
			expect(result5).not.toContain(otherUser);
			// no match
			const result6 = await repo.findWithoutImportUser(school, { fullName: 'Fox' });
			expect(result6).not.toContain(user);
			expect(result6).not.toContain(otherUser);
		});

		it('should sort returned users by firstname, lastname', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school, firstName: 'Anna', lastName: 'Schmidt' });
			const otherUser = userFactory.build({ school, firstName: 'Peter', lastName: 'Ball' });
			await em.persistAndFlush([user, otherUser]);
			const result = await repo.findWithoutImportUser(school, undefined, {
				order: { firstName: SortOrder.desc },
			});
			expect(result.indexOf(user)).toEqual(1);
			expect(result.indexOf(otherUser)).toEqual(0);

			const result2 = await repo.findWithoutImportUser(school, undefined, {
				order: { firstName: SortOrder.asc },
			});
			expect(result2.indexOf(user)).toEqual(0);
			expect(result2.indexOf(otherUser)).toEqual(1);

			const result3 = await repo.findWithoutImportUser(school, undefined, {
				order: { lastName: SortOrder.desc },
			});
			expect(result3.indexOf(user)).toEqual(0);
			expect(result3.indexOf(otherUser)).toEqual(1);

			const result4 = await repo.findWithoutImportUser(school, undefined, {
				order: { lastName: SortOrder.asc },
			});
			expect(result4.indexOf(user)).toEqual(1);
			expect(result4.indexOf(otherUser)).toEqual(0);
		});

		it('should skip returned two users by one', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			const result = await repo.findWithoutImportUser(school, undefined, { pagination: { skip: 1 } });
			expect(result).not.toContain(user);
			expect(result).toContain(otherUser);
			expect(result.length).toEqual(1);
		});

		it('should limit returned users from two to one', async () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const otherUser = userFactory.build({ school });
			await em.persistAndFlush([user, otherUser]);
			const result = await repo.findWithoutImportUser(school, undefined, { pagination: { limit: 1 } });
			expect(result).toContain(user);
			expect(result).not.toContain(otherUser);
			expect(result.length).toEqual(1);
		});
	});
});
