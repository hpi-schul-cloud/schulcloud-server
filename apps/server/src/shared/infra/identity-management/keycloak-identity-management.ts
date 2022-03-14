import { IAccount, IAccountUpdate } from '@shared/domain';

/* eslint-disable no-nested-ternary */
import { Inject, Injectable } from '@nestjs/common';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { GrantTypes } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { IIdentityManagement } from './identity-management.interface';

interface KcSettings {
	realmName: string;
	baseUrl: string;
	credentials: KcCredentials;
	sourceRealm: string;
}

interface KcCredentials {
	grantType: GrantTypes;
	username: string;
	password: string;
	clientId: string;
}

@Injectable()
export class KeycloakIdentityManagement implements IIdentityManagement {
	private lastAuthorizationTime = 0;

	private static AUTHORIZATION_TIMEBOX_MS = 59 * 1000;

	public constructor(
		@Inject('KeycloakAdminClient') private readonly kcAdminClient: KcAdminClient,
		@Inject('KeycloakSettings') private readonly kcSettings: KcSettings
	) {
		kcAdminClient.setConfig({
			baseUrl: kcSettings.baseUrl,
			realmName: kcSettings.realmName,
		});
	}

	async createAccount(account: IAccount, password?: string): Promise<string | null> {
		await this.authorizeAccess();
		let id: { id: string };
		try {
			id = await this.kcAdminClient.users.create({
				username: account.userName,
				email: account.email,
				firstName: account.firstName,
				lastName: account.lastName,
			});
		} catch {
			return null;
		}

		if (id && password) {
			try {
				await this.resetPassword(id.id, password);
			} catch {
				await this.deleteAccountById(id.id);
				return null;
			}
		}
		return id.id;
	}

	async updateAccount(accountId: string, account: IAccountUpdate): Promise<string | null> {
		await this.authorizeAccess();
		try {
			await this.kcAdminClient.users.update(
				{ id: accountId },
				{
					email: account.email,
					firstName: account.firstName,
					lastName: account.lastName,
				}
			);
			return accountId;
		} catch {
			return null;
		}
	}

	async updateAccountPassword(accountId: string, password: string): Promise<string | null> {
		await this.authorizeAccess();
		try {
			await this.resetPassword(accountId, password);
			return accountId;
		} catch {
			return null;
		}
	}

	async findAccountById(accountId: string): Promise<IAccount | null> {
		await this.authorizeAccess();
		try {
			const keycloakUser = await this.kcAdminClient.users.findOne({
				id: accountId,
			});
			return keycloakUser ? this.extractAccount(keycloakUser) : null;
		} catch {
			return null;
		}
	}

	async getAllAccounts(): Promise<IAccount[]> {
		await this.authorizeAccess();
		try {
			const keycloakUsers = await this.kcAdminClient.users.find();
			return keycloakUsers.map((user: UserRepresentation) => this.extractAccount(user));
		} catch {
			return [];
		}
	}

	async deleteAccountById(accountId: string): Promise<string | null> {
		await this.authorizeAccess();
		try {
			await this.kcAdminClient.users.del({
				id: accountId,
			});
			return accountId;
		} catch {
			return null;
		}
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
