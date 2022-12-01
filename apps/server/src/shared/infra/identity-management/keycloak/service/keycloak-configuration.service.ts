import AuthenticationExecutionInfoRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationExecutionInfoRepresentation';
import AuthenticationFlowRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationFlowRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Inject } from '@nestjs/common';
import { SystemTypeEnum } from '@shared/domain';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { ConfigService } from '@nestjs/config';
import { IServerConfig } from '@src/modules/server/server.config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { IdentityProviderConfig, IKeycloakSettings, KeycloakSettings } from '../interface';
import { OidcIdentityProviderMapper } from '../mapper/identity-provider.mapper';
import { KeycloakAdministrationService } from './keycloak-administration.service';

enum ConfigureAction {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

const flowAlias = 'Direct Broker Flow';
const clientId = 'dbildungscloud-server';
const defaultIdpMapperName = 'oidc-username-idp-mapper';
export class KeycloakConfigurationService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly httpService: HttpService,
		private readonly systemService: SystemService,
		private readonly configService: ConfigService<IServerConfig, true>,
		private readonly oidcIdentityProviderMapper: OidcIdentityProviderMapper,
		@Inject(KeycloakSettings) private readonly kcSettings: IKeycloakSettings,
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
		const scDomain = this.configService.get<string>('SC_DOMAIN');
		const redirectUri =
			scDomain === 'localhost' ? 'http://localhost:3030/api/v3/sso/oauth/' : `https://${scDomain}/api/v3/sso/oauth/`;
		const kcRealmBaseUrl = `${this.kcSettings.baseUrl}/realms/${kc.realmName}`;
		const cr: ClientRepresentation = {
			clientId,
			enabled: true,
			protocol: 'openid-connect',
			publicClient: false,
			redirectUris: [`${redirectUri}*`],
		};
		let defaultClientInternalId = (await kc.clients.find({ clientId }))[0]?.id;
		if (!defaultClientInternalId) {
			({ id: defaultClientInternalId } = await kc.clients.create(cr));
		} else {
			await kc.clients.update({ id: defaultClientInternalId }, cr);
		}
		const generatedClientSecret = await kc.clients.generateNewClientSecret({ id: defaultClientInternalId });

		let keycloakSystem: SystemDto;
		const systems = await this.systemService.find(SystemTypeEnum.KEYCLOAK);
		if (systems.length === 0) {
			keycloakSystem = new SystemDto({ type: SystemTypeEnum.KEYCLOAK });
		} else {
			[keycloakSystem] = systems;
		}
		await this.setKeycloakSystemInformation(
			keycloakSystem,
			kcRealmBaseUrl,
			redirectUri,
			generatedClientSecret.value ?? ''
		);
		await this.systemService.save(keycloakSystem);
	}

	public async configureIdentityProviders(): Promise<number> {
		let count = 0;
		const kc = await this.kcAdmin.callKcAdminClient();
		const oldConfigs = await kc.identityProviders.find();
		const newConfigs = (await this.systemService.findOidc()) as IdentityProviderConfig[];
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

	async configureRealm(): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.realms.update(
			{
				realm: kc.realmName,
			},
			{
				editUsernameAllowed: true,
			}
		);
	}

	private async setKeycloakSystemInformation(
		keycloakSystem: SystemDto,
		kcRealmBaseUrl: string,
		redirectUri: string,
		generatedClientSecret: string
	) {
		const wellKnownUrl = `${kcRealmBaseUrl}/.well-known/openid-configuration`;
		const response = (await lastValueFrom(this.httpService.get<Record<string, unknown>>(wellKnownUrl))).data;

		keycloakSystem.type = SystemTypeEnum.KEYCLOAK;
		keycloakSystem.alias = 'Keycloak';
		keycloakSystem.oauthConfig = {
			clientId,
			clientSecret: this.defaultEncryptionService.encrypt(generatedClientSecret),
			grantType: 'authorization_code',
			scope: 'openid profile email',
			responseType: 'code',
			provider: 'oauth',
			redirectUri,
			tokenEndpoint: response.token_endpoint as string,
			authEndpoint: response.authorization_endpoint as string,
			logoutEndpoint: response.end_session_endpoint as string,
			jwksEndpoint: response.jwks_uri as string,
			issuer: kcRealmBaseUrl,
		};
		return keycloakSystem;
	}

	/**
	 * decides for each system if it needs to be added, updated or deleted in keycloak
	 *
	 * @param newConfigs
	 * @param oldConfigs
	 * @returns
	 */
	private selectConfigureAction(newConfigs: SystemDto[], oldConfigs: IdentityProviderRepresentation[]) {
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
		if (system.type === SystemTypeEnum.OIDC) {
			await kc.identityProviders.create(
				this.oidcIdentityProviderMapper.mapToKeycloakIdentityProvider(system, flowAlias)
			);
			await this.createIdpDefaultMapper(system.alias);
		}
	}

	private async updateIdentityProvider(system: IdentityProviderConfig): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		if (system.type === SystemTypeEnum.OIDC) {
			await kc.identityProviders.update(
				{ alias: system.alias },
				this.oidcIdentityProviderMapper.mapToKeycloakIdentityProvider(system, flowAlias)
			);
			await this.updateOrCreateIdpDefaultMapper(system.alias);
		}
	}

	private async updateOrCreateIdpDefaultMapper(idpAlias: string) {
		const kc = await this.kcAdmin.callKcAdminClient();
		const allMappers = await kc.identityProviders.findMappers({ alias: idpAlias });
		const defaultMapper = allMappers.find((mapper) => mapper.name === defaultIdpMapperName);
		if (defaultMapper?.id) {
			await kc.identityProviders.updateMapper(
				{ alias: idpAlias, id: defaultMapper.id },
				this.getIdpMapperConfiguration(idpAlias, defaultMapper.id)
			);
		} else {
			await this.createIdpDefaultMapper(idpAlias);
		}
	}

	private async createIdpDefaultMapper(idpAlias: string) {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.identityProviders.createMapper({
			alias: idpAlias,
			identityProviderMapper: this.getIdpMapperConfiguration(idpAlias),
		});
	}

	private getIdpMapperConfiguration(idpAlias: string, id?: string): IdentityProviderMapperRepresentation {
		return {
			id,
			identityProviderAlias: idpAlias,
			name: defaultIdpMapperName,
			identityProviderMapper: defaultIdpMapperName,
			// eslint-disable-next-line no-template-curly-in-string
			config: { syncMode: 'FORCE', target: 'LOCAL', template: '${CLAIM.sub}' },
		};
	}

	private async deleteIdentityProvider(alias: string): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.identityProviders.del({ alias });
	}
}
