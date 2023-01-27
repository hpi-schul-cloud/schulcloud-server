export abstract class IdentityManagementOauthService {
	/**
	 * Checks the given credentials with the IDM and returns an JWT on success.
	 * @param username the username of the account to check.
	 * @param password the password of the account to check.
	 * @returns the JWT as string or undefined on failure.
	 */
	abstract resourceOwnerPasswordGrant(username: string, password: string): Promise<string | undefined>;
}
