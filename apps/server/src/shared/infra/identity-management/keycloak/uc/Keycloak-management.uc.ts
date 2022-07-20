import fs from 'node:fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { SystemRepo } from '@shared/repo';
import { System } from '@shared/domain';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { ConfigService } from '@nestjs/config';
import { NodeEnvType } from '@src/server.config';
import { IdentityProviderConfig } from '../interface/identity-provider-config.type';
import { SysType } from '../../sys.type';
import {
	IJsonAccount,
	IJsonUser,
	IKeycloakManagementInputFiles,
	IKeycloakSettings,
	KeycloakManagementInputFiles,
	KeycloakSettings,
} from '../interface';
import { KeycloakAdministrationService } from '../keycloak-administration.service';

enum ConfigureAction {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

@Injectable()
export class KeycloakManagementUc {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly systemRepo: SystemRepo,
		private readonly configService: ConfigService<unknown, true>,
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
				userCount += (await this.createOrUpdateIdmAccount(account, user)) ? 1 : 0;
			}
		}
		return userCount;
	}

	async configureIdentityProviders(): Promise<number> {
		let count = 0;
		const kc = await this.kcAdmin.callKcAdminClient();
		const envType = this.configService.get<NodeEnvType>('NODE_ENV');
		const oldConfigs = await kc.identityProviders.find();
		const newConfigs = await this.loadConfigs(envType, [SysType.OIDC]);
		const configureActions = this.selectConfigureAction(newConfigs, oldConfigs);
		// eslint-disable-next-line no-restricted-syntax
		for (const configureAction of configureActions) {
			if (configureAction.action === ConfigureAction.CREATE) {
				// eslint-disable-next-line no-await-in-loop
				await this.createIdentityProvider(configureAction.config);
				count += 1;
			}
			if (configureAction.action === ConfigureAction.UPDATE) {
				// eslint-disable-next-line no-await-in-loop
				await this.updateIdentityProvider(configureAction.config);
				count += 1;
			}
			if (configureAction.action === ConfigureAction.DELETE) {
				// eslint-disable-next-line no-await-in-loop
				await this.deleteIdentityProvider(configureAction.alias);
				count += 1;
			}
		}
		return count;
	}

	private selectConfigureAction(newConfigs: System[], oldConfigs: IdentityProviderRepresentation[]) {
		const result = [] as (
			| { action: ConfigureAction.CREATE; config: IdentityProviderConfig }
			| { action: ConfigureAction.UPDATE; config: IdentityProviderConfig }
			| { action: ConfigureAction.DELETE; alias: string }
		)[];
		// updating or creating configs
		newConfigs.forEach((newConfig) => {
			if (oldConfigs.some((oldConfig) => oldConfig.alias === newConfig.alias)) {
				result.push({ action: ConfigureAction.UPDATE, config: newConfig as IdentityProviderConfig });
			} else {
				result.push({ action: ConfigureAction.CREATE, config: newConfig as IdentityProviderConfig });
			}
		});
		// deleting configs
		oldConfigs.forEach((oldConfig) => {
			if (!newConfigs.some((newConfig) => newConfig.alias === oldConfig.alias)) {
				result.push({ action: ConfigureAction.DELETE, alias: oldConfig.alias as string });
			}
		});
		return result;
	}

	private async createOrUpdateIdmAccount(account: IJsonAccount, user: IJsonUser) {
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

	private async createIdentityProvider(system: IdentityProviderConfig): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		if (system.type === SysType.OIDC) {
			await kc.identityProviders.create({
				providerId: system.type,
				alias: system.alias,
				enabled: true,
				config: {
					clientId: this.configService.get<string>(system.config.clientId),
					clientSecret: this.configService.get<string>(system.config.clientSecret),
					authorizationUrl: system.config.authorizationUrl,
					tokenUrl: system.config.tokenUrl,
					logoutUrl: system.config.logoutUrl,
				},
			});
		}
	}

	private async updateIdentityProvider(system: IdentityProviderConfig): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		if (system.type === SysType.OIDC) {
			await kc.identityProviders.update(
				{ alias: system.alias },
				{
					providerId: system.type,
					alias: system.alias,
					enabled: true,
					config: {
						clientId: this.configService.get<string>(system.config.clientId),
						clientSecret: this.configService.get<string>(system.config.clientSecret),
						authorizationUrl: system.config.authorizationUrl,
						tokenUrl: system.config.tokenUrl,
						logoutUrl: system.config.logoutUrl,
					},
				}
			);
		}
	}

	private async deleteIdentityProvider(alias: string): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.identityProviders.del({ alias });
	}

	private async loadConfigs(envType: NodeEnvType, sysTypes: SysType[]): Promise<IdentityProviderConfig[]> {
		if (envType === NodeEnvType.TEST || envType === NodeEnvType.DEVELOPMENT) {
			const data = await fs.readFile(this.inputFiles.systemsFile, { encoding: 'utf-8' });
			const systems = JSON.parse(data) as IdentityProviderConfig[];
			return systems.filter((system) => sysTypes.includes(system.type as SysType));
		}
		if (envType === NodeEnvType.PRODUCTION) {
			return (await this.systemRepo.findAll()).filter((system) =>
				sysTypes.includes(system.type as SysType)
			) as IdentityProviderConfig[];
		}
		return [];
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
