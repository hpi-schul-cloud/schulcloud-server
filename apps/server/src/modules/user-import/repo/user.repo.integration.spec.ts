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
