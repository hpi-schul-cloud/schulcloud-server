import { type AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { AccountSearchType } from '../domain/type/account-search-type';
import { AdminApiAccountUc } from './admin-api-account.uc';

describe('AdminApiAccountUc', () => {
	const accountService = {
		searchByUsernamePartialMatch: jest.fn(),
		findByUserId: jest.fn(),
		findById: jest.fn(),
		delete: jest.fn(),
	} as unknown as jest.Mocked<AccountService>;
	const uc = new AdminApiAccountUc(accountService);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('searchAccounts', () => {
		it('searches usernames with the requested pagination and maps account data', async () => {
			const account = accountDoFactory.build({ id: 'account-id', userId: 'user-id', username: 'learner@example.org' });
			accountService.searchByUsernamePartialMatch.mockResolvedValue([[account], 3]);

			const result = await uc.searchAccounts({ type: AccountSearchType.USERNAME, value: 'learner', skip: 5, limit: 1 });

			expect(accountService.searchByUsernamePartialMatch).toHaveBeenCalledWith('learner', 5, 1);
			expect(result).toEqual(
				expect.objectContaining({
					total: 3,
					skip: 5,
					limit: 1,
					data: [expect.objectContaining({ id: 'account-id', userId: 'user-id', username: 'learner@example.org' })],
				})
			);
		});

		it('uses default pagination when none is supplied', async () => {
			accountService.searchByUsernamePartialMatch.mockResolvedValue([[], 0]);

			const result = await uc.searchAccounts({ type: AccountSearchType.USERNAME, value: 'missing' });

			expect(accountService.searchByUsernamePartialMatch).toHaveBeenCalledWith('missing', 0, 10);
			expect(result).toEqual(expect.objectContaining({ total: 0, skip: 0, limit: 10, data: [] }));
		});

		it('looks up a user ID and returns an empty page when the account is missing', async () => {
			accountService.findByUserId.mockResolvedValue(null);

			const result = await uc.searchAccounts({ type: AccountSearchType.USER_ID, value: 'user-id' });

			expect(accountService.findByUserId).toHaveBeenCalledWith('user-id');
			expect(accountService.searchByUsernamePartialMatch).not.toHaveBeenCalled();
			expect(result).toEqual(expect.objectContaining({ total: 0, skip: 0, limit: 10, data: [] }));
		});
	});

	describe('findAccount', () => {
		it('loads and maps an account by ID', async () => {
			const account = accountDoFactory.build({ id: 'account-id', username: 'learner@example.org' });
			accountService.findById.mockResolvedValue(account);

			const result = await uc.findAccount('account-id');

			expect(accountService.findById).toHaveBeenCalledWith('account-id');
			expect(result).toEqual(expect.objectContaining({ id: 'account-id', username: 'learner@example.org' }));
		});
	});

	describe('deleteAccount', () => {
		it('returns the account and deletes it', async () => {
			const account = accountDoFactory.build({ id: 'account-id', username: 'learner@example.org' });
			accountService.findById.mockResolvedValue(account);

			const result = await uc.deleteAccount('account-id');

			expect(accountService.findById).toHaveBeenCalledWith('account-id');
			expect(accountService.delete).toHaveBeenCalledWith('account-id');
			expect(result).toEqual(expect.objectContaining({ id: 'account-id', username: 'learner@example.org' }));
		});
	});
});
