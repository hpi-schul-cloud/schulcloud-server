import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, User } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { accountFactory, cleanupCollections, userFactory } from '@shared/testing';
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

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Account);
	});

	describe('findByUserId', () => {
		it('should findByUserId', async () => {
			const accountToFind = accountFactory.build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			const account = await repo.findByUserId(accountToFind.userId ?? '');
			expect(account?.id).toEqual(accountToFind.id);
		});
	});

	describe('findByUsernameAndSystemId', () => {
		it('should return account', async () => {
			const accountToFind = accountFactory.withSystemId(new ObjectId(10)).build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			const account = await repo.findByUsernameAndSystemId(accountToFind.username ?? '', accountToFind.systemId ?? '');
			expect(account?.username).toEqual(accountToFind.username);
		});
		it('should return null', async () => {
			const account = await repo.findByUsernameAndSystemId('', new ObjectId(undefined));
			expect(account).toBeNull();
		});
	});

	describe('findMultipleByUserId', () => {
		it('should find multiple user by id', async () => {
			const anAccountToFind = accountFactory.build();
			const anotherAccountToFind = accountFactory.build();
			await em.persistAndFlush(anAccountToFind);
			await em.persistAndFlush(anotherAccountToFind);
			em.clear();
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const accounts = await repo.findMultipleByUserId([anAccountToFind.userId!, anotherAccountToFind.userId!]);
			expect(accounts).toContainEqual(anAccountToFind);
			expect(accounts).toContainEqual(anotherAccountToFind);
			expect(accounts).toHaveLength(2);
		});

		it('should return empty list if no results', async () => {
			const accountToFind = accountFactory.build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			const accounts = await repo.findMultipleByUserId(['123456789012', '098765432101']);
			expect(accounts).toHaveLength(0);
		});
	});

	describe('findByUserIdOrFail', () => {
		it('should find a user by id', async () => {
			const accountToFind = accountFactory.build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			const account = await repo.findByUserIdOrFail(accountToFind.userId ?? '');
			expect(account.id).toEqual(accountToFind.id);
		});

		it('should throw if id does not exist', async () => {
			const accountToFind = accountFactory.build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			await expect(repo.findByUserIdOrFail('123456789012')).rejects.toThrow(NotFoundError);
		});
	});

	describe('getObjectReference', () => {
		it('should return a valid reference', async () => {
			const user = userFactory.buildWithId();
			const account = accountFactory.build({ userId: user.id });
			await em.persistAndFlush([user, account]);

			const reference = repo.getObjectReference(User, account.userId ?? '');

			expect(reference).toBe(user);
		});
	});

	describe('saveWithoutFlush', () => {
		it('should add an account to the persist stack', () => {
			const account = accountFactory.build();

			repo.saveWithoutFlush(account);
			expect(em.getUnitOfWork().getPersistStack().size).toBe(1);
		});
	});

	describe('flush', () => {
		it('should flush after save', async () => {
			const account = accountFactory.build();
			em.persist(account);

			expect(account.id).toBeNull();

			await repo.flush();

			expect(account.id).not.toBeNull();
		});
	});

	describe('findByUsername', () => {
		it('should find account by user name', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const account = accountFactory.build({ username: originalUsername });
			await em.persistAndFlush([account]);
			em.clear();

			const [result] = await repo.searchByUsernameExactMatch('USER@EXAMPLE.COM');
			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(expect.objectContaining({ username: originalUsername }));

			const [result2] = await repo.searchByUsernamePartialMatch('user');
			expect(result2).toHaveLength(1);
			expect(result2[0]).toEqual(expect.objectContaining({ username: originalUsername }));
		});
		it('should find account by user name, ignoring case', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const account = accountFactory.build({ username: originalUsername });
			await em.persistAndFlush([account]);
			em.clear();

			let [accounts] = await repo.searchByUsernameExactMatch('USER@example.COM');
			expect(accounts).toHaveLength(1);
			expect(accounts[0]).toEqual(expect.objectContaining({ username: originalUsername }));

			[accounts] = await repo.searchByUsernameExactMatch('user@example.com');
			expect(accounts).toHaveLength(1);
			expect(accounts[0]).toEqual(expect.objectContaining({ username: originalUsername }));
		});
		it('should not find by wildcard', async () => {
			const originalUsername = 'USER@EXAMPLE.COM';
			const account = accountFactory.build({ username: originalUsername });
			await em.persistAndFlush([account]);
			em.clear();

			let [accounts] = await repo.searchByUsernameExactMatch('USER@EXAMPLECCOM');
			expect(accounts).toHaveLength(0);

			[accounts] = await repo.searchByUsernameExactMatch('.*');
			expect(accounts).toHaveLength(0);
		});
	});

	describe('deleteId', () => {
		it('should delete an account by id', async () => {
			const account = accountFactory.buildWithId();
			await em.persistAndFlush([account]);

			await expect(repo.deleteById(account.id)).resolves.not.toThrow();

			await expect(repo.findById(account.id)).rejects.toThrow(NotFoundError);
		});
	});

	describe('deleteByUserId', () => {
		it('should delete an account by user id', async () => {
			const user = userFactory.buildWithId();
			const account = accountFactory.build({ userId: user.id });
			await em.persistAndFlush([user, account]);

			await expect(repo.deleteByUserId(user.id)).resolves.not.toThrow();

			await expect(repo.findById(account.id)).rejects.toThrow(NotFoundError);
		});
	});

	describe('findMany', () => {
		it('should find all accounts', async () => {
			const foundAccounts = await repo.findMany();
			expect(foundAccounts).toEqual(mockAccounts);
		});
		it('limit the result set ', async () => {
			const limit = 1;
			const foundAccounts = await repo.findMany(0, limit);
			expect(foundAccounts).toHaveLength(limit);
		});
		it('skip n entries ', async () => {
			const offset = 2;
			const foundAccounts = await repo.findMany(offset);
			expect(foundAccounts).toHaveLength(mockAccounts.length - offset);
		});
	});
});
