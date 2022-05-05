import { IAccount, IAccountUpdate } from '@shared/domain';

/* eslint-disable no-nested-ternary */
import { Inject, Injectable } from '@nestjs/common';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { IKeycloakSettings, KeycloakSettings } from '@shared/infra/identity-management/keycloak';
import { IdentityManagement } from './identity-management';

@Injectable()
export class KeycloakIdentityManagement extends IdentityManagement {
	private lastAuthorizationTime = 0;

	private static AUTHORIZATION_TIMEBOX_MS = 59 * 1000;

	public constructor(
		@Inject(KeycloakAdminClient) private readonly kcAdminClient: KeycloakAdminClient,
		@Inject(KeycloakSettings) private readonly kcSettings: IKeycloakSettings
	) {
		super();
		kcAdminClient.setConfig({
			baseUrl: kcSettings.baseUrl,
			realmName: kcSettings.realmName,
		});
	}

	async createAccount(account: IAccount, password?: string): Promise<string> {
		await this.authorizeAccess();

		const id = await this.kcAdminClient.users.create({
			username: account.userName,
			email: account.email,
			firstName: account.firstName,
			lastName: account.lastName,
		});
		if (id && password) {
			try {
				await this.resetPassword(id.id, password);
			} catch (err) {
				await this.deleteAccountById(id.id);
				throw err;
			}
		}
		return id.id;
	}

	async updateAccount(accountId: string, account: IAccountUpdate): Promise<string> {
		await this.authorizeAccess();
		await this.kcAdminClient.users.update(
			{ id: accountId },
			{
				email: account.email,
				firstName: account.firstName,
				lastName: account.lastName,
			}
		);
		return accountId;
	}

	async updateAccountPassword(accountId: string, password: string): Promise<string> {
		await this.authorizeAccess();
		await this.resetPassword(accountId, password);
		return accountId;
	}

	async findAccountById(accountId: string): Promise<IAccount> {
		await this.authorizeAccess();
		const keycloakUser = await this.kcAdminClient.users.findOne({ id: accountId });
		if (!keycloakUser) {
			throw Error(`Account '${accountId}' not found`);
		}
		return this.extractAccount(keycloakUser);
	}

	async getAllAccounts(): Promise<IAccount[]> {
		await this.authorizeAccess();
		const keycloakUsers = await this.kcAdminClient.users.find();
		return keycloakUsers.map((user: UserRepresentation) => this.extractAccount(user));
	}

	async deleteAccountById(accountId: string): Promise<string> {
		await this.authorizeAccess();
		await this.kcAdminClient.users.del({ id: accountId });
		return accountId;
	}

	private async authorizeAccess() {
		const elapsedTimeMilliseconds = new Date().getTime() - this.lastAuthorizationTime;
		if (elapsedTimeMilliseconds > KeycloakIdentityManagement.AUTHORIZATION_TIMEBOX_MS) {
			await this.kcAdminClient.auth(this.kcSettings.credentials);
			this.lastAuthorizationTime = new Date().getTime();
		}
	}

	private extractAccount(user: UserRepresentation): IAccount {
		return {
			id: user.id,
			userName: user.username,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		};
	}

	private async resetPassword(accountId: string, password: string) {
		await this.kcAdminClient.users.resetPassword({
			id: accountId,
			credential: {
				temporary: false,
				type: 'password',
				value: password,
			},
		});
	}
}
