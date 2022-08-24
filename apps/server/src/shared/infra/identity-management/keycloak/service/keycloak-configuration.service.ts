import AuthenticationExecutionInfoRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationExecutionInfoRepresentation';
import AuthenticationFlowRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationFlowRepresentation';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Inject } from '@nestjs/common';
import { System } from '@shared/domain';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { SystemRepo } from '@shared/repo';
import { SC_DOMAIN } from '../../../../../../../../config/globals.js';
import { SysType } from '../../sys.type';
import { IdentityProviderConfig } from '../interface';
import { OidcIdentityProviderMapper } from '../mapper/identity-provider.mapper';
import { KeycloakAdministrationService } from './keycloak-administration.service';

enum ConfigureAction {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

export const flowAlias = 'Direct Broker Flow';
export const CLIENT_ID = 'dbildungscloud-server';

export class KeycloakConfigurationService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly systemRepo: SystemRepo,
		private readonly oidcIdentityProviderMapper: OidcIdentityProviderMapper,
		@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: IEncryptionService
	) {}

	public async configureBrokerFlows(): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		const executionProviders = ['idp-create-user-if-unique', 'idp-auto-link'];
		const getFlowsRequest = kc.realms.makeRequest<{ realmName: string }, AuthenticationFlowRepresentation[]>({
			method: 'GET',
			path: '/{realmName}/authentication/flows',
			urlParamKeys: ['realmName'],
		});
		const flows = await getFlowsRequest({ realmName: kc.realmName });
		const flow = flows.find((tempFlow) => tempFlow.alias === flowAlias);
		if (flow && flow.id) {
			return;
		}
		const createFlowRequest = kc.realms.makeRequest<AuthenticationFlowRepresentation & { realmName: string }, void>({
			method: 'POST',
			path: '/{realmName}/authentication/flows',
			urlParamKeys: ['realmName'],
		});
		const getFlowExecutionsRequest = kc.realms.makeRequest<
			{ realmName: string; flowAlias: string },
			AuthenticationExecutionInfoRepresentation[]
		>({
			method: 'GET',
			path: '/{realmName}/authentication/flows/{flowAlias}/executions',
			urlParamKeys: ['realmName', 'flowAlias'],
		});
		const addExecutionRequest = kc.realms.makeRequest<{ realmName: string; flowAlias: string; provider: string }, void>(
			{
				method: 'POST',
				path: '/{realmName}/authentication/flows/{flowAlias}/executions/execution',
				urlParamKeys: ['realmName', 'flowAlias'],
			}
		);
		const updateExecutionRequest = kc.realms.makeRequest<
			AuthenticationExecutionInfoRepresentation & { realmName: string; flowAlias: string },
			void
		>({
			method: 'PUT',
			path: '/{realmName}/authentication/flows/{flowAlias}/executions',
			urlParamKeys: ['realmName', 'flowAlias'],
		});
		await createFlowRequest({
			realmName: kc.realmName,
			alias: flowAlias,
			description: 'First broker login which automatically creates or maps accounts.',
			providerId: 'basic-flow',
			topLevel: true,
			builtIn: false,
		});
		// eslint-disable-next-line no-restricted-syntax
		for (const executionProvider of executionProviders) {
			// eslint-disable-next-line no-await-in-loop
			await addExecutionRequest({
				realmName: kc.realmName,
				flowAlias,
				provider: executionProvider,
			});
		}
		const executions = await getFlowExecutionsRequest({
			realmName: kc.realmName,
			flowAlias,
		});
		// eslint-disable-next-line no-restricted-syntax
		for (const execution of executions) {
			// eslint-disable-next-line no-await-in-loop
			await updateExecutionRequest({
				realmName: kc.realmName,
				flowAlias,
				id: execution.id,
				requirement: 'ALTERNATIVE',
			});
		}
	}

	public async configureClient(): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		let id = (await kc.clients.find({ clientId: CLIENT_ID }))[0]?.id;
		if (!id) {
			({ id } = await kc.clients.create({
				clientId: CLIENT_ID,
				publicClient: false,
			}));
		}
		const generatedClientSecret = await kc.clients.generateNewClientSecret({ id });
		const systems = await this.systemRepo.findByFilter(SysType.KEYCLOAK, false);
		if (systems.length === 0 && generatedClientSecret.value) {
			const keycloakSystem = new System({
				type: SysType.KEYCLOAK,
				alias: 'Keycloak',
				oauthConfig: {
					clientId: CLIENT_ID,
					clientSecret: this.defaultEncryptionService.encrypt(generatedClientSecret.value),
					grantType: 'authorization_code',
					scope: 'openid profile email',
					responseType: 'code',
					provider: 'oauth',
					tokenEndpoint: `${kc.baseUrl}realms/${kc.realmName}/protocol/openid-connect/token`,
					redirectUri: '',
					authEndpoint: `${kc.baseUrl}realms/${kc.realmName}/protocol/openid-connect/auth`,
					logoutEndpoint: `${kc.baseUrl}realms/${kc.realmName}/protocol/openid-connect/logout`,
					jwksEndpoint: `${kc.baseUrl}realms/${kc.realmName}/protocol/openid-connect/certs`,
					issuer: `${kc.baseUrl}realms/${kc.realmName}`,
				},
			});
			await this.systemRepo.save(keycloakSystem);
			if (keycloakSystem.oauthConfig) {
				keycloakSystem.oauthConfig.redirectUri = `https://${SC_DOMAIN}/api/v3/sso/oauth/${keycloakSystem.id}`;
			}
			await this.systemRepo.save(keycloakSystem);
		}
	}

	public async configureIdentityProviders(): Promise<number> {
		let count = 0;
		const kc = await this.kcAdmin.callKcAdminClient();
		const oldConfigs = await kc.identityProviders.find();
		const newConfigs = await this.loadConfigs([SysType.OIDC]);
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
			await kc.identityProviders.create(
				this.oidcIdentityProviderMapper.mapToKeycloakIdentityProvider(system, flowAlias)
			);
		}
	}

	private async updateIdentityProvider(system: IdentityProviderConfig): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		if (system.type === SysType.OIDC) {
			await kc.identityProviders.update(
				{ alias: system.alias },
				this.oidcIdentityProviderMapper.mapToKeycloakIdentityProvider(system, flowAlias)
			);
		}
	}

	private async loadConfigs(sysTypes: SysType[]): Promise<IdentityProviderConfig[]> {
		return (await this.systemRepo.findAll()).filter((system) =>
			sysTypes.includes(system.type as SysType)
		) as IdentityProviderConfig[];
	}

	private async deleteIdentityProvider(alias: string): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.identityProviders.del({ alias });
	}
}
