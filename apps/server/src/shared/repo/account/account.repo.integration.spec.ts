import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { userFactory, accountFactory, cleanupCollections, importUserFactory } from '@shared/testing';
import { AccountRepo } from './account.repo';

describe('account repo', () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: AccountRepo;
	let mockAccounts: Account[];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [AccountRepo],
		}).compile();
		repo = module.get(AccountRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		mockAccounts = [
			accountFactory.build({ username: 'John Doe' }),
			accountFactory.build({ username: 'Marry Doe' }),
			accountFactory.build({ username: 'Susi Doe' }),
			accountFactory.build({ username: 'Tim Doe' }),
		];
		await em.persistAndFlush(mockAccounts);
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findByUserId', () => {
		it('should findByUserId', async () => {
			const accountToFind = accountFactory.build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			const account = await repo.findByUserId(accountToFind.user.id);
			expect(account.id).toEqual(accountToFind.id);
		});
	});
	describe('findOneByUser', () => {
		it('should find by User and return an account', async () => {
			const user = userFactory.buildWithId();
			const account = new Account({ username: 'Max Mustermann', user });
			await repo.save([account]);

			const result = await repo.findOneByUser(user);
			expect(result).toEqual(account);
		});
		it('should throw an error', async () => {
			const user = userFactory.buildWithId();
			await expect(repo.findOneByUser(user)).rejects.toThrowError();
		});
		it('should not respond with an account for wrong id given', async () => {
			const user = userFactory.build();
			const account = accountFactory.build();
			const otherSchoolsImportUser = importUserFactory.build();
			await em.persistAndFlush([user, account, otherSchoolsImportUser]);
			await expect(async () => repo.findOneByUser({} as unknown as User)).rejects.toThrowError(
				'Account not found ({ user: null })'
			);
		});
	});

	describe('getObjectReference', () => {
		it('should return a valid reference', async () => {
			const user = userFactory.build();
			const account = accountFactory.build({ user });
			await em.persistAndFlush([user, account]);

			const reference = repo.getObjectReference(User, account.user.id);

			expect(reference).toBe(user);
		});
	});
});
