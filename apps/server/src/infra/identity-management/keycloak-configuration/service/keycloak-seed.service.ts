import { LegacyLogger } from '@core/logger';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { Inject } from '@nestjs/common';
import fs from 'node:fs/promises';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { JsonAccount } from '../interface/json-account.interface';
import { JsonUser } from '../interface/json-user.interface';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig } from '../keycloak-configuration.config';

export class KeycloakSeedService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly logger: LegacyLogger,
		@Inject(KEYCLOAK_CONFIGURATION_CONFIG_TOKEN) private readonly config: KeycloakConfigurationConfig
	) {}

	async seed(): Promise<number> {
		let userCount = 0;
		const users = await this.loadUsers();
		const accounts = await this.loadAccounts();
		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			const account = accounts.find((a) => a.userId.$oid === user._id.$oid);
			if (account) {
				// eslint-disable-next-line no-await-in-loop
				userCount += (await this.createOrUpdateIdmAccount(account, user)) ? 1 : 0;
			}
		}
		return userCount;
	}

	public async clean(pageSize = 100): Promise<number> {
		let foundUsers = 1;
		let deletedUsers = 0;
		const adminUser = this.kcAdmin.getAdminUser();
		let kc = await this.kcAdmin.callKcAdminClient();
		this.logger.log(`Starting to delete users...`);
		while (foundUsers > 0) {
			// eslint-disable-next-line no-await-in-loop
			kc = await this.kcAdmin.callKcAdminClient();
			// eslint-disable-next-line no-await-in-loop
			const users = (await kc.users.find({ max: pageSize })).filter((user) => user.username !== adminUser);
			foundUsers = users.length;
			this.logger.log(`Amount of found Users: ${foundUsers}`);
			for (const user of users) {
				// eslint-disable-next-line no-await-in-loop
				await kc.users.del({
					id: user.id ?? '',
				});
			}
			deletedUsers += foundUsers;
			this.logger.log(`...deleted ${deletedUsers} users so far.`);
		}
		return deletedUsers;
	}

	private async createOrUpdateIdmAccount(account: JsonAccount, user: JsonUser): Promise<boolean> {
		const idmUserRepresentation: UserRepresentation = {
			username: account.username,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			enabled: true,
			credentials: [
				{
					type: 'password',
					secretData: `{"value": "${account.password}", "salt": "", "additionalParameters": {}}`,
					credentialData: '{ "hashIterations": 10, "algorithm": "bcrypt", "additionalParameters": {}}',
				},
			],
			attributes: {
				dbcAccountId: account._id.$oid,
				dbcUserId: account.userId.$oid,
				dbcSystemId: account.systemId,
			},
		};
		const kc = await this.kcAdmin.callKcAdminClient();
		const existingAccounts = await kc.users.find({ username: account.username, exact: true });
		if (existingAccounts.length === 1 && existingAccounts[0].id) {
			await kc.users.update({ id: existingAccounts[0].id }, idmUserRepresentation);
			return true;
		}
		if (existingAccounts.length === 0) {
			await kc.users.create(idmUserRepresentation);
			return true;
		}
		// else, unreachable, multiple accounts for same username (unique)
		return false;
	}

	private async loadAccounts(): Promise<JsonAccount[]> {
		const data = await fs.readFile(this.config.accountsFile, { encoding: 'utf-8' });
		return JSON.parse(data) as JsonAccount[];
	}

	private async loadUsers(): Promise<JsonUser[]> {
		const data = await fs.readFile(this.config.usersFile, { encoding: 'utf-8' });
		return JSON.parse(data) as JsonUser[];
	}
}
