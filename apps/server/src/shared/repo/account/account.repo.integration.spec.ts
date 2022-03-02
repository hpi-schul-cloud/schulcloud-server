import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { userFactory, accountFactory, systemFactory, cleanupCollections } from '@shared/testing';
import { AccountRepo } from './account.repo';

describe('account repo', () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: AccountRepo;
	let mockAccounts: Account[];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ debug: true })],
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

	describe('create', () => {
		it('should create and return an account', async () => {
			let account = new Account({
				username: 'Max Mustermann',
				user: userFactory.build(),
				system: systemFactory.build(),
			});
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

	describe('findByUserId', () => {
		it('should findByUserId', async () => {
			const accountToFind = accountFactory.build();
			await em.persistAndFlush(accountToFind);
			em.clear();
			const account = await repo.findByUserId(accountToFind.user.id);
			expect(account.id).toEqual(accountToFind.id);
		});
	});
});
