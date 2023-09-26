import { Counted, IdmAccount, IdmAccountUpdate } from '@shared/domain';

export type SearchOptions = {
	exact?: boolean;
	skip?: number;
	limit?: number;
};

export abstract class IdentityManagementService {
	/**
	 * Create a new account in the identity management.
	 *
	 * @param account the account's details
	 * @param [password] the account's password (optional)
	 * @returns the account id if created successfully
	 */
	abstract createAccount(account: IdmAccountUpdate, password?: string | undefined): Promise<string>;

	/**
	 * Update an existing account's details.
	 *
	 * @param accountId the account to be updated.
	 * @param account the account data to be applied.
	 * @returns the account id if updated successfully
	 */
	abstract updateAccount(accountId: string, account: IdmAccountUpdate): Promise<string>;

	/**
	 * Update an existing account's password.
	 *
	 * @param accountId the account to be updated.
	 * @param password the new password (clear).
	 * @returns the account id if updated successfully
	 */
	abstract updateAccountPassword(accountId: string, password: string): Promise<string>;

	/**
	 * Load a specific account by its id.
	 *
	 * @param accountId the account to be loaded.
	 * @returns the account if exists
	 */
	abstract findAccountById(accountId: string): Promise<IdmAccount>;

	/**
	 * Load a specific account by its dbc account id.
	 *
	 * @param accountDbcAccountId the account to be loaded.
	 * @returns the account if exists
	 */
	abstract findAccountByDbcAccountId(accountDbcAccountId: string): Promise<IdmAccount>;

	/**
	 * Load a specific account by its dbc user id.
	 *
	 * @param accountDbcUserId the account to be loaded.
	 * @returns the account if exists
	 */
	abstract findAccountByDbcUserId(accountDbcUserId: string): Promise<IdmAccount>;

	/**
	 * Loads the account with the specific username.
	 * @param username of the account to be loaded.
	 * @param options the search options to be applied.
	 * @returns the found accounts (might be empty).
	 */
	abstract findAccountsByUsername(username: string, options?: SearchOptions): Promise<Counted<IdmAccount[]>>;

	/**
	 * Load all accounts.
	 *
	 * @returns an array of all accounts (might be empty)
	 */
	abstract getAllAccounts(): Promise<IdmAccount[]>;

	/**
	 * Deletes an account from the identity management.
	 * @param accountId the account to be deleted.
	 * @returns the accounts id if deleted successfully
	 */
	abstract deleteAccountById(accountId: string): Promise<string>;

	/**
	 * Gets an attribute value of a specific user.
	 * @param userId the id of the user to get an attribute value.
	 * @param attributeName the name of the attribute to get.
	 * @returns the attribute value if exists, null otherwise.
	 */
	abstract getUserAttribute<TValue extends boolean | number | string>(
		userId: string,
		attributeName: string
	): Promise<TValue | null>;

	/**
	 * Sets an attribute value of a specific user.
	 * @param userId the id of the user to set an attribute value.
	 * @param attributeName the name of the attribute to set.
	 * @param attributeValue the value of the attribute to set.
	 */
	abstract setUserAttribute<TValue extends boolean | number | string>(
		userId: string,
		attributeName: string,
		attributeValue: TValue
	): Promise<void>;
}
