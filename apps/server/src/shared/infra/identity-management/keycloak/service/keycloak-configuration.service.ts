import fs from 'node:fs/promises';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { System } from '@shared/domain';
import { SystemRepo } from '@shared/repo';
import { NodeEnvType } from '@src/server.config';
import { IdentityProviderConfig, IKeycloakManagementInputFiles, KeycloakManagementInputFiles } from '../interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { SysType } from '../../sys.type';

enum ConfigureAction {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

export class KeycloakConfigurationService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly systemRepo: SystemRepo,
		private readonly configService: ConfigService<unknown, true>,
		@Inject(KeycloakManagementInputFiles) private readonly inputFiles: IKeycloakManagementInputFiles
	) {}

	public async configureIdentityProviders() {
		let count = 0;
		const envType = this.configService.get<NodeEnvType>('NODE_ENV');
		const kc = await this.kcAdmin.callKcAdminClient();
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

	/**
	 * decides for each system if it needs to be added, updated or deleted in keycloak
	 *
	 * @param newConfigs
	 * @param oldConfigs
	 * @returns
	 */
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

	private async loadConfigs(envType: NodeEnvType, sysTypes: SysType[]): Promise<IdentityProviderConfig[]> {
		if (envType === NodeEnvType.TEST || envType === NodeEnvType.DEVELOPMENT) {
			const data: string = await fs.readFile(this.inputFiles.systemsFile, { encoding: 'utf-8' });
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

	private async deleteIdentityProvider(alias: string): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.identityProviders.del({ alias });
	}
}
