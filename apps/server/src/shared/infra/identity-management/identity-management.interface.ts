import { IAccount, IAccountUpdate } from '@shared/domain';

export interface IIdentityManagement {
	/**
	 * Create a new account in the identity management.
	 *
	 * @param account the account's details
	 * @param [password] the account's password (optional)
	 * @returns the account id if created successfully
	 */
	createAccount(account: IAccount, password?: string | undefined): Promise<string>;

	/**
	 * Update an existing account's details.
	 *
	 * @param accountId the account to be updated.
	 * @param account the account data to be applied.
	 * @returns the account id if updated successfully
	 */
	updateAccount(accountId: string, account: IAccountUpdate): Promise<string>;

	/**
	 * Update an existing account's password.
	 *
	 * @param accountId the account to be updated.
	 * @param password the new password (clear).
	 * @returns the account id if updated successfully
	 */
	updateAccountPassword(accountId: string, password: string): Promise<string>;

	/**
	 * Load a specific account by its id.
	 *
	 * @param accountId the account to be loaded.
	 * @returns the account if exists
	 */
	findAccountById(accountId: string): Promise<IAccount>;

	/**
	 * Load all accounts.
	 *
	 * @returns an array of all accounts (might be empty)
	 */
	getAllAccounts(): Promise<IAccount[]>;

	/**
	 * Deletes an account from the identity management.
	 * @param accountId the account to be deleted.
	 * @returns the accounts id if deleted successfully
	 */
	deleteAccountById(accountId: string): Promise<string>;
}
