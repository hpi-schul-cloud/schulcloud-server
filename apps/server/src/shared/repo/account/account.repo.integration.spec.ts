import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { accountFactory, importUserFactory, schoolFactory, userFactory } from '@shared/testing';
import { AccountRepo } from './account.repo';

const mockAccounts: Account[] = [
	new Account({ username: 'John Doe', userId: new ObjectId() }),
	new Account({ username: 'Marry Doe', userId: new ObjectId() }),
	new Account({ username: 'Susi Doe', userId: new ObjectId() }),
	new Account({ username: 'Tim Doe', userId: new ObjectId() }),
];

describe('account repo', () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: AccountRepo;

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
		await em.persistAndFlush(mockAccounts);
	});

	afterEach(async () => {
		const accounts = await em.find(Account, {});
		await em.removeAndFlush(accounts);
	});

	describe('create', () => {
		it('should create and return an account', async () => {
			let account = new Account({ username: 'Max Mustermann', userId: new ObjectId() });
			expect(account.id).toBeNull();
			account = await repo.create(account);
			expect(account.id).not.toBeNull();
			expect(account.id).toBeDefined();
		});
	});

	describe('read', () => {
		it('should return an account', async () => {
			const account = await repo.read(mockAccounts[0].id);
			expect(account).toEqual<Account>(mockAccounts[0]);
		});

		it('should throw entity not found error', async () => {
			await expect(repo.read('')).rejects.toThrowError('Account entity not found.');
		});
	});

	describe('update', () => {
		it('should update and return an account', async () => {
			const account1 = mockAccounts[0];
			account1.activated = true;
			await repo.update(account1);
			const account2 = await repo.read(mockAccounts[0].id);
			expect(account1).toEqual(account2);
		});
	});

	describe('delete', () => {
		it('should delete and return an account', async () => {
			const account = await repo.delete(mockAccounts[0].id);
			await expect(em.find(Account, { id: account.id })).resolves.toEqual([]);
		});

		it('should throw entity not found error', async () => {
			await expect(repo.delete('')).rejects.toThrowError('Account entity not found.');
		});
	});

	describe('findOneByUser', () => {
		it('should find by User and return an account', async () => {
			const user = userFactory.buildWithId();
			const account = new Account({ username: 'Max Mustermann', userId: user._id });
			await repo.create(account);

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
			await expect(async () => repo.findOneByUser({} as unknown as User)).rejects.toThrowError('invalid user id');
		});
	});
});
