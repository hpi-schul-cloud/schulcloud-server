import { IAccount, IAccountUpdate } from '@shared/domain';

export interface IIdentityManagement {
	/**
	 * Create a new account in the identity management.
	 *
	 * @param account the account's details
	 * @param [password] the account's password (optional)
	 * @returns the account id if created successfully, otherwise null
	 */
	createAccount(account: IAccount, password?: string | undefined): Promise<string | null>;

	/**
	 * Update an existing account's details.
	 *
	 * @param accountId the account to be updated.
	 * @param account the account data to be applied.
	 * @returns the account id if updated successfully, otherwise null
	 */
	updateAccount(accountId: string, account: IAccountUpdate): Promise<string | null>;

	/**
	 * Update an existing account's password.
	 *
	 * @param accountId the account to be updated.
	 * @param password the new password (clear).
	 * @returns the account id if updated successfully, otherwise null
	 */
	updateAccountPassword(accountId: string, password: string): Promise<string | null>;

	/**
	 * Load a specific account by its id.
	 *
	 * @param accountId the account to be loaded.
	 * @returns the account if exists, otherwise null
	 */
	findAccountById(accountId: string): Promise<IAccount | null>;

	/**
	 * Load all accounts.
	 *
	 * @returns an array of all accounts (might be empty)
	 */
	getAllAccounts(): Promise<IAccount[]>;

	/**
	 * Deletes an account from the identity management.
	 * @param accountId the account to be deleted.
	 * @returns the accounts id if deleted successfully, otherwise null
	 */
	deleteAccountById(accountId: string): Promise<string | null>;
}
