import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@shared/domain';
import { AccountRepo } from '@shared/repo/account';
import { AccountUc } from './account.uc';

const mockAccount = new Account({ username: 'John Doe', userId: new ObjectId() });

describe('AccountUc', () => {
	let module: TestingModule;
	let uc: AccountUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountUc,
				{
					provide: AccountRepo,
					useValue: {
						create: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						read: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						update: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
						delete: (): Promise<Account> => {
							return Promise.resolve(mockAccount);
						},
					},
				},
			],
		}).compile();
		uc = module.get(AccountUc);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findOneById', () => {
		it('should return an account', async () => {
			const account = await uc.findOneById(mockAccount.userId.toString());
			expect(account).toEqual(mockAccount);
		});
	});

	describe('create', () => {
		it('should return an account', async () => {
			const account = await uc.create(mockAccount);
			expect(account).toEqual(mockAccount);
		});
	});

	describe('update', () => {
		it('should return an account', async () => {
			const account = await uc.update(mockAccount);
			expect(account).toEqual(mockAccount);
		});
	});

	describe('remove', () => {
		it('should return an account', async () => {
			const account = await uc.remove(mockAccount.userId.toString());
			expect(account).toEqual(mockAccount);
		});
	});
});
