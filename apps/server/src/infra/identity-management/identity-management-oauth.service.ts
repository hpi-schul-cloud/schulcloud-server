import type { OauthConfig } from '@modules/system';

export abstract class IdentityManagementOauthService {
	/**
	 * Returns the oauth config of the IDM.
	 * @returns the oauth config of the IDM.
	 * @throws an error if the IDM oauth config is not available.
	 */
	abstract getOauthConfig(): Promise<OauthConfig>;

	/**
	 * Checks if the IDM oauth config is available.
	 * @returns true if the IDM oauth config is available, false otherwise.
	 */
	abstract isOauthConfigAvailable(): Promise<boolean>;

	/**
	 * Checks the given credentials with the IDM and returns an JWT on success.
	 * @param username the username of the account to check.
	 * @param password the password of the account to check.
	 * @returns the JWT as string or undefined on failure.
	 */
	abstract resourceOwnerPasswordGrant(username: string, password: string): Promise<string | undefined>;
}
