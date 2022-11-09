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
import { Configuration } from '@hpi-schul-cloud/commons';
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
		private readonly systemService: SystemService,
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
		const SC_DOMAIN = Configuration.get('SC_DOMAIN') as string;
		let redirectUri = `https://${SC_DOMAIN}/api/v3/sso/oauth/`;
		// TODO grab from well-known endpoint or move to separat environmental variable, see EW-326
		let kcBaseUrl = `${this.kcSettings.baseUrl}/realms/${kc.realmName}`;
		if (SC_DOMAIN === 'localhost') {
			redirectUri = `http://localhost:3030/api/v3/sso/oauth/`;
			kcBaseUrl = `http://localhost:8080/realms/${kc.realmName}`;
		}
		const cr: ClientRepresentation = {};
		cr.clientId = clientId;
		cr.enabled = true;
		cr.protocol = 'openid-connect';
		cr.publicClient = false;
		cr.redirectUris = [`${redirectUri}*`];
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
		this.setKeycloakSystemInformation(keycloakSystem, kcBaseUrl, redirectUri, generatedClientSecret.value ?? '');
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

	private setKeycloakSystemInformation(
		keycloakSystem: SystemDto,
		kcBaseUrl: string,
		redirectUri: string,
		generatedClientSecret: string
	) {
		keycloakSystem.type = SystemTypeEnum.KEYCLOAK;
		keycloakSystem.alias = 'Keycloak';
		keycloakSystem.oauthConfig = {
			clientId,
			clientSecret: this.defaultEncryptionService.encrypt(generatedClientSecret),
			grantType: 'authorization_code',
			scope: 'openid profile email',
			responseType: 'code',
			provider: 'oauth',
			// TODO grab from well-known endpoint instead of storing here, see EW-326
			tokenEndpoint: `${kcBaseUrl}/protocol/openid-connect/token`,
			redirectUri: `${redirectUri}`,
			authEndpoint: `${kcBaseUrl}/protocol/openid-connect/auth`,
			logoutEndpoint: `${kcBaseUrl}/protocol/openid-connect/logout`,
			jwksEndpoint: `${kcBaseUrl}/protocol/openid-connect/certs`,
			issuer: `${kcBaseUrl}`,
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
