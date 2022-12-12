import fs from 'node:fs/promises';
import { Inject } from '@nestjs/common';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { IJsonAccount, IJsonUser, IKeycloakManagementInputFiles, KeycloakManagementInputFiles } from '../interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';

export class KeycloakSeedService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		@Inject(KeycloakManagementInputFiles) private readonly inputFiles: IKeycloakManagementInputFiles // @Inject(KeycloakManagementInputFiles) private readonly fs: IKeycloakManagementInputFiles
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

	public async clean(): Promise<number> {
		let kc = await this.kcAdmin.callKcAdminClient();
		const adminUser = this.kcAdmin.getAdminUser();
		const users = (await kc.users.find()).filter((user) => user.username !== adminUser);

		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			// needs to be called once per minute. To be save we call it in the loop. Ineffcient but ok, since only used to locally revert seeding
			// eslint-disable-next-line no-await-in-loop
			kc = await this.kcAdmin.callKcAdminClient();
			// eslint-disable-next-line no-await-in-loop
			await kc.users.del({
				// can not be undefined, see filter above
				id: user.id ?? '',
			});
		}
		return users.length;
	}

	private async createOrUpdateIdmAccount(account: IJsonAccount, user: IJsonUser): Promise<boolean> {
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
				refTechnicalId: account._id.$oid,
				refFunctionalIntId: account.userId.$oid,
				refFunctionalExtId: account.systemId,
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

	private async loadAccounts(): Promise<IJsonAccount[]> {
		const data = await fs.readFile(this.inputFiles.accountsFile, { encoding: 'utf-8' });
		return JSON.parse(data) as IJsonAccount[];
	}

	private async loadUsers(): Promise<IJsonUser[]> {
		const data = await fs.readFile(this.inputFiles.usersFile, { encoding: 'utf-8' });
		return JSON.parse(data) as IJsonUser[];
	}
}
