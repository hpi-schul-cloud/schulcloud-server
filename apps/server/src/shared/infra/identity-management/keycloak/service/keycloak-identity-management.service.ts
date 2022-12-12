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
		const kc = await this.kcAdminClient.callKcAdminClient();
		const id = await kc.users.create({
			username: account.username,
			email: account.email,
			firstName: account.firstName,
			lastName: account.lastName,
			enabled: true,
			attributes: {
				refTechnicalId: account.attRefTechnicalId,
				refFunctionalIntId: account.attRefFunctionalIntId,
				refFunctionalExtId: account.attRefFunctionalExtId,
			},
		});
		if (id && password) {
			try {
				await kc.users.resetPassword({
					id: id.id,
					credential: {
						temporary: false,
						type: 'password',
						value: password,
					},
				});
			} catch (err) {
				await kc.users.del(id);
				throw err;
			}
		}
		return id.id;
	}

	async updateAccount(id: string, account: IAccountUpdate): Promise<string> {
		await (
			await this.kcAdminClient.callKcAdminClient()
		).users.update(
			{ id },
			{
				username: account.username,
				email: account.email,
				firstName: account.firstName,
				lastName: account.lastName,
				enabled: true,
			}
		);
		return id;
	}

	async updateAccountPassword(id: string, password: string): Promise<string> {
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
		return id;
	}

	async findAccountById(id: string): Promise<IAccount> {
		const keycloakUser = await (await this.kcAdminClient.callKcAdminClient()).users.findOne({ id });
		if (!keycloakUser) {
			throw new Error(`Account '${id}' not found`);
		}
		return this.extractAccount(keycloakUser);
	}

	async findAccountByTecRefId(accountTecRefId: string): Promise<IAccount> {
		const keycloakUsers = await (
			await this.kcAdminClient.callKcAdminClient()
		).users.find({ q: `refTechnicalId:${accountTecRefId} }` });
		if (keycloakUsers.length > 1) {
			throw new Error('Multiple accounts for the same id!');
		}
		if (keycloakUsers.length === 0) {
			throw new Error(`Account '${accountTecRefId}' not found`);
		}

		return this.extractAccount(keycloakUsers[0]);
	}

	async findAccountByFctIntId(accountFctIntId: string): Promise<IAccount> {
		const keycloakUsers = await (
			await this.kcAdminClient.callKcAdminClient()
		).users.find({ refFunctionalIntId: accountFctIntId });

		if (keycloakUsers.length > 1) {
			throw new Error('Multiple accounts for the same id!');
		}
		if (keycloakUsers.length === 0) {
			throw new Error(`Account '${accountFctIntId}' not found`);
		}

		return this.extractAccount(keycloakUsers[0]);
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

	async deleteAccountById(id: string): Promise<string> {
		await (await this.kcAdminClient.callKcAdminClient()).users.del({ id });
		return id;
	}

	private extractAccount(user: UserRepresentation): IAccount {
		const ret: IAccount = {
			id: user.id ?? '',
			username: user.username,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			createdDate: user.createdTimestamp ? new Date(user.createdTimestamp) : undefined,
		};
		ret.attRefFunctionalExtId = this.extractAttributeValue(user.attributes?.refFunctionalExtId);
		ret.attRefFunctionalIntId = this.extractAttributeValue(user.attributes?.refFunctionalIntId);
		ret.attRefTechnicalId = this.extractAttributeValue(user.attributes?.refTechnicalId);

		return ret;
	}

	private extractAttributeValue(value: unknown): string {
		if (Array.isArray(value)) {
			return value[0] as string;
		}
		return value as string;
	}
}
