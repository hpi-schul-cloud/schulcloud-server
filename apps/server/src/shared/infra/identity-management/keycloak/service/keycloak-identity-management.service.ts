import { IAccount, IAccountUpdate } from '@shared/domain';

/* eslint-disable no-nested-ternary */
import { Injectable } from '@nestjs/common';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { EntityNotFoundError } from '@shared/common';
import { IdentityManagementService } from '../../identity-management.service';
import { KeycloakAdministrationService } from './keycloak-administration.service';

@Injectable()
export class KeycloakIdentityManagementService extends IdentityManagementService {
	public constructor(private readonly kcAdminClient: KeycloakAdministrationService) {
		super();
	}

	async createAccount(account: IAccount, password?: string): Promise<string> {
		const id = await (
			await this.kcAdminClient.callKcAdminClient()
		).users.create({
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
		await (
			await this.kcAdminClient.callKcAdminClient()
		).users.update(
			{ id: accountId },
			{
				username: account.username,
				email: account.email,
				firstName: account.firstName,
				lastName: account.lastName,
			}
		);
		return accountId;
	}

	async updateAccountPassword(accountId: string, password: string): Promise<string> {
		await this.resetPassword(accountId, password);
		return accountId;
	}

	async findAccountById(accountId: string): Promise<IAccount> {
		const keycloakUser = await (await this.kcAdminClient.callKcAdminClient()).users.findOne({ id: accountId });
		if (!keycloakUser) {
			throw new Error(`Account '${accountId}' not found`);
		}
		return this.extractAccount(keycloakUser);
	}

	async findAccountByUsername(username: string): Promise<IAccount | undefined> {
		const [keycloakUser] = await (await this.kcAdminClient.callKcAdminClient()).users.find({ username });
		if (keycloakUser) {
			return this.extractAccount(keycloakUser);
		}
		return undefined;
	}

	async getAllAccounts(): Promise<IAccount[]> {
		const keycloakUsers = await (await this.kcAdminClient.callKcAdminClient()).users.find();
		return keycloakUsers.map((user: UserRepresentation) => this.extractAccount(user));
	}

	async deleteAccountById(accountId: string): Promise<string> {
		await (await this.kcAdminClient.callKcAdminClient()).users.del({ id: accountId });
		return accountId;
	}

	async deleteAccountByUsername(username: string): Promise<string | undefined> {
		const kc = await this.kcAdminClient.callKcAdminClient();
		const [account] = await kc.users.find({ username });

		if (account.id) {
			await kc.users.del({ id: account.id });
		}
		return account.id;
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
		await (
			await this.kcAdminClient.callKcAdminClient()
		).users.resetPassword({
			id: accountId,
			credential: {
				temporary: false,
				type: 'password',
				value: password,
			},
		});
	}
}
