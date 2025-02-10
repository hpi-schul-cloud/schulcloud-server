import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error';
import { IdmAccount, IdmAccountUpdate } from '@shared/domain/interface';
import { Counted } from '@shared/domain/types';
import { IdentityManagementService, SearchOptions } from '../../identity-management.service';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';

@Injectable()
export class KeycloakIdentityManagementService extends IdentityManagementService {
	constructor(private readonly kcAdminClient: KeycloakAdministrationService) {
		super();
	}

	public async createAccount(account: IdmAccount, password?: string): Promise<string> {
		const kc = await this.kcAdminClient.callKcAdminClient();
		const id = await kc.users.create({
			username: account.username,
			email: account.email,
			firstName: account.firstName,
			lastName: account.lastName,
			enabled: true,
			attributes: {
				dbcAccountId: account.attDbcAccountId,
				dbcUserId: account.attDbcUserId,
				dbcSystemId: account.attDbcSystemId,
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

	public async updateAccount(id: string, account: IdmAccountUpdate): Promise<string> {
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

	public async updateAccountPassword(id: string, password: string): Promise<string> {
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

	public async findAccountById(id: string): Promise<IdmAccount> {
		const keycloakUser = await (await this.kcAdminClient.callKcAdminClient()).users.findOne({ id });
		if (!keycloakUser) {
			throw new Error(`Account '${id}' not found`);
		}
		return this.extractAccount(keycloakUser);
	}

	public async findAccountByDbcAccountId(accountDbcAccountId: string): Promise<IdmAccount> {
		const keycloakUsers = await (
			await this.kcAdminClient.callKcAdminClient()
		).users.find({ q: `dbcAccountId:${accountDbcAccountId} }` });
		if (keycloakUsers.length > 1) {
			throw new Error('Multiple accounts for the same id!');
		}
		if (keycloakUsers.length === 0) {
			throw new Error(`Account '${accountDbcAccountId}' not found`);
		}

		return this.extractAccount(keycloakUsers[0]);
	}

	public async findAccountByDbcUserId(accountDbcUserId: string): Promise<IdmAccount> {
		const keycloakUsers = await (
			await this.kcAdminClient.callKcAdminClient()
		).users.find({ q: `dbcUserId:${accountDbcUserId} }` });

		if (keycloakUsers.length > 1) {
			throw new Error('Multiple accounts for the same id!');
		}
		if (keycloakUsers.length === 0) {
			throw new Error(`Account '${accountDbcUserId}' not found`);
		}

		return this.extractAccount(keycloakUsers[0]);
	}

	public async findAccountsByUsername(username: string, options?: SearchOptions): Promise<Counted<IdmAccount[]>> {
		const kc = await this.kcAdminClient.callKcAdminClient();
		const total = await kc.users.count({ username });
		const results = await kc.users.find({
			username,
			exact: options?.exact,
			first: options?.skip,
			max: options?.limit,
		});
		const accounts = results.map((account) => this.extractAccount(account));
		return [accounts, total];
	}

	public async getAllAccounts(): Promise<IdmAccount[]> {
		const keycloakUsers = await (await this.kcAdminClient.callKcAdminClient()).users.find();
		return keycloakUsers.map((user: UserRepresentation) => this.extractAccount(user));
	}

	public async deleteAccountById(id: string): Promise<string> {
		await (await this.kcAdminClient.callKcAdminClient()).users.del({ id });
		return id;
	}

	public async getUserAttribute<TValue extends boolean | number | string | unknown = unknown>(
		userId: string,
		attributeName: string
	): Promise<TValue | null> {
		const kc = await this.kcAdminClient.callKcAdminClient();
		const user = await kc.users.findOne({ id: userId });
		if (!user) {
			throw new EntityNotFoundError(`User '${userId}' not found`);
		}
		if (user.attributes && user.attributes[attributeName] && Array.isArray(user.attributes[attributeName])) {
			const [value] = (user.attributes[attributeName] as TValue[]) || null;
			return value;
		}
		return null;
	}

	public async setUserAttribute<TValue extends boolean | number | string>(
		userId: string,
		attributeName: string,
		attributeValue: TValue
	): Promise<void> {
		const kc = await this.kcAdminClient.callKcAdminClient();
		const user = await kc.users.findOne({ id: userId });
		if (!user) {
			throw new EntityNotFoundError(`User '${userId}' not found`);
		}
		if (user.attributes) {
			user.attributes[attributeName] = attributeValue;
		} else {
			user.attributes = { [attributeName]: attributeValue };
		}
		await kc.users.update({ id: userId }, user);
	}

	private extractAccount(user: UserRepresentation): IdmAccount {
		const ret: IdmAccount = {
			id: user.id ?? '',
			username: user.username,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			createdDate: user.createdTimestamp ? new Date(user.createdTimestamp) : undefined,
		};
		ret.attDbcSystemId = this.extractAttributeValue(user.attributes?.dbcSystemId);
		ret.attDbcUserId = this.extractAttributeValue(user.attributes?.dbcUserId);
		ret.attDbcAccountId = this.extractAttributeValue(user.attributes?.dbcAccountId);

		return ret;
	}

	private extractAttributeValue(value: unknown): string {
		if (Array.isArray(value)) {
			return value[0] as string;
		}
		return value as string;
	}
}
