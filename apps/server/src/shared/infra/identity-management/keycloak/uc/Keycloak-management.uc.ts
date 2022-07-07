import { Inject, Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import { EnvType, SysType } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { System } from '@shared/domain';
import { KeycloakAdministrationService } from '../keycloak-administration.service';
import {
	IConfigureOptions,
	IJsonAccount,
	IJsonUser,
	IKeycloakManagementInputFiles,
	IKeycloakSettings,
	KeycloakManagementInputFiles,
	KeycloakSettings,
} from '../interface';

@Injectable()
export class KeycloakManagementUc {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly systemRepo: SystemRepo,
		@Inject(KeycloakSettings) private readonly kcSettings: IKeycloakSettings,
		@Inject(KeycloakManagementInputFiles) private readonly inputFiles: IKeycloakManagementInputFiles
	) {}

	public async check(): Promise<boolean> {
		return this.kcAdmin.testKcConnection();
	}

	public async clean(): Promise<number> {
		let kc = await this.kcAdmin.callKcAdminClient();
		const adminUser = this.kcAdmin.getAdminUser();
		const users = (await kc.users.find()).filter((user) => user.username !== adminUser);

		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
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

	async seed(): Promise<number> {
		let userCount = 0;
		const users = await this.loadUsers();
		const accounts = await this.loadAccounts();
		// eslint-disable-next-line no-restricted-syntax
		for (const user of users) {
			const account = accounts.find((a) => a.userId.$oid === user._id.$oid);
			if (account) {
				// eslint-disable-next-line no-await-in-loop
				const kc = await this.kcAdmin.callKcAdminClient();
				// eslint-disable-next-line no-await-in-loop
				await kc.users.create({
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
				});
				userCount += 1;
			}
		}
		return userCount;
	}

	// TODO wip
	async configure(options: IConfigureOptions): Promise<number> {
		let kc = await this.kcAdmin.callKcAdminClient();
		const oldConfigs = await kc.identityProviders.find();
		const newConfigs = await this.loadConfigs(options.envType, options.sysType);
		for (const config of newConfigs) {
			const kc = await this.kcAdmin.callKcAdminClient();
			await kc.identityProviders.create({
				providerId: 'oidc',
				alias: config.alias ?? '',
				realm: this.kcSettings.realmName,
			});
		}
		return newConfigs.length;
	}

	private async loadConfigs(envType: EnvType, sysType: SysType): Promise<System[]> {
		if (envType === EnvType.Dev) {
			const data = await fs.readFile(this.inputFiles.systemsFile, { encoding: 'utf-8' });
			const systems = JSON.parse(data) as System[];
			return systems.filter((system) => system.type === sysType);
		}
		if (envType === EnvType.Prod) {
			return (await this.systemRepo.findAll()).filter((system) => system.type === sysType);
		}
		throw new Error('EnvType not recognized');
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
