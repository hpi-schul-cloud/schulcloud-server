import fs from 'node:fs/promises';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IJsonAccount, IJsonUser, IKeycloakManagementInputFiles, KeycloakManagementInputFiles } from '../interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';

export class KeycloakSeedService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly configService: ConfigService<unknown, true>,
		@Inject(KeycloakManagementInputFiles) private readonly inputFiles: IKeycloakManagementInputFiles
	) {}

	public async createOrUpdateIdmAccount(account: IJsonAccount, user: IJsonUser) {
		const idmUserRepresentation = {
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

	public async loadAccounts(): Promise<IJsonAccount[]> {
		const data = await fs.readFile(this.inputFiles.accountsFile, { encoding: 'utf-8' });
		return JSON.parse(data) as IJsonAccount[];
	}

	public async loadUsers(): Promise<IJsonUser[]> {
		const data = await fs.readFile(this.inputFiles.usersFile, { encoding: 'utf-8' });
		return JSON.parse(data) as IJsonUser[];
	}
}
