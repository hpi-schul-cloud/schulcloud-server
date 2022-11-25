import { IAccount, IAccountUpdate } from '@shared/domain';

/* eslint-disable no-nested-ternary */
import { Injectable } from '@nestjs/common';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
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
			attributes: {
				mongoId: account.id,
			},
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
		const id = await this.getExternalId(accountId);
		await (
			await this.kcAdminClient.callKcAdminClient()
		).users.update(
			{ id },
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
		const id = await this.getExternalId(accountId);
		await this.resetPassword(id, password);
		return accountId;
	}

	async findAccountById(accountId: string): Promise<IAccount> {
		const id = await this.getExternalId(accountId);
		const keycloakUser = await (await this.kcAdminClient.callKcAdminClient()).users.findOne({ id });
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
		const id = await this.getExternalId(accountId);
		await (await this.kcAdminClient.callKcAdminClient()).users.del({ id });
		return accountId;
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
		const id = await this.getExternalId(accountId);
		await (
			await this.kcAdminClient.callKcAdminClient()
		).users.resetPassword({
			id,
			credential: {
				temporary: false,
				type: 'password',
				value: password,
			},
		});
	}

	private async getExternalId(accountId: string): Promise<string> {
		const kc = await this.kcAdminClient.callKcAdminClient();
		const users = await kc.users.find({ mongoId: accountId });

		if (users.length === 1) {
			return users[0].id as string;
		}

		if (users.length === 0) {
			return accountId;
		}

		throw new Error('Multiple accounts for the same id!');
	}
}
