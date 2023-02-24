import AuthenticationExecutionInfoRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationExecutionInfoRepresentation';
import AuthenticationFlowRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationFlowRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import IdentityProviderMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderMapperRepresentation';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import ProtocolMapperRepresentation from '@keycloak/keycloak-admin-client/lib/defs/protocolMapperRepresentation';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemTypeEnum } from '@shared/domain';
import { IServerConfig } from '@src/modules/server/server.config';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { OidcIdentityProviderMapper } from '../mapper/identity-provider.mapper';

enum ConfigureAction {
	CREATE = 'create',
	UPDATE = 'update',
	DELETE = 'delete',
}

const flowAlias = 'Direct Broker Flow';
const defaultIdpMapperName = 'oidc-username-idp-mapper';

@Injectable()
export class KeycloakConfigurationService {
	constructor(
		private readonly kcAdmin: KeycloakAdministrationService,
		private readonly configService: ConfigService<IServerConfig, true>,
		private readonly oidcIdentityProviderMapper: OidcIdentityProviderMapper,
		private readonly systemService: SystemService
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
		const cr: ClientRepresentation = {
			clientId: this.kcAdmin.getClientId(),
			enabled: true,
			protocol: 'openid-connect',
			publicClient: false,
			redirectUris: [`${redirectUri}*`],
		};
		let defaultClientInternalId = (await kc.clients.find({ clientId: this.kcAdmin.getClientId() }))[0]?.id;
		if (!defaultClientInternalId) {
			({ id: defaultClientInternalId } = await kc.clients.create(cr));
			await kc.clients.addProtocolMapper(
				{ id: defaultClientInternalId },
				this.getExternalSubClientMapperConfiguration()
			);
		} else {
			await kc.clients.update({ id: defaultClientInternalId }, cr);
		}
	}

	public async configureIdentityProviders(): Promise<number> {
		let count = 0;
		const kc = await this.kcAdmin.callKcAdminClient();
		const oldConfigs = await kc.identityProviders.find();
		const newConfigs = await this.systemService.findByType(SystemTypeEnum.OIDC);
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

	/**
	 * decides for each system if it needs to be added, updated or deleted in keycloak
	 *
	 * @param newConfigs
	 * @param oldConfigs
	 * @returns
	 */
	private selectConfigureAction(newConfigs: SystemDto[], oldConfigs: IdentityProviderRepresentation[]) {
		const result = [] as (
			| { action: ConfigureAction.CREATE; config: SystemDto }
			| { action: ConfigureAction.UPDATE; config: SystemDto }
			| { action: ConfigureAction.DELETE; alias: string }
		)[];
		// updating or creating configs
		newConfigs.forEach((newConfig) => {
			if (oldConfigs.some((oldConfig) => oldConfig.alias === newConfig.alias)) {
				result.push({ action: ConfigureAction.UPDATE, config: newConfig });
			} else {
				result.push({ action: ConfigureAction.CREATE, config: newConfig });
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

	private async createIdentityProvider(system: SystemDto): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		if (system.oidcConfig && system.oidcConfig?.alias) {
			await kc.identityProviders.create(
				this.oidcIdentityProviderMapper.mapToKeycloakIdentityProvider(system, flowAlias)
			);
			await this.createIdpDefaultMapper(system.oidcConfig.alias);
		}
	}

	private async updateIdentityProvider(system: SystemDto): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		if (system.oidcConfig && system.oidcConfig?.alias) {
			await kc.identityProviders.update(
				{ alias: system.oidcConfig.alias },
				this.oidcIdentityProviderMapper.mapToKeycloakIdentityProvider(system, flowAlias)
			);
			await this.updateOrCreateIdpDefaultMapper(system.oidcConfig.alias);
		}
	}

	private async deleteIdentityProvider(alias: string): Promise<void> {
		const kc = await this.kcAdmin.callKcAdminClient();
		await kc.identityProviders.del({ alias });
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
			name: 'OIDC User Attribute Mapper',
			identityProviderAlias: idpAlias,
			identityProviderMapper: 'oidc-user-attribute-idp-mapper',
			config: {
				syncMode: 'FORCE',
				'are.claim.values.regex': false,
				claim: 'sub',
				'user.attribute': 'external_sub',
			},
		};
	}

	private getExternalSubClientMapperConfiguration(): ProtocolMapperRepresentation {
		return {
			name: 'External Sub Mapper',
			protocol: 'openid-connect',
			protocolMapper: 'oidc-usermodel-attribute-mapper',
			config: {
				'aggregate.attrs': false,
				'userinfo.token.claim': true,
				multivalued: false,
				'user.attribute': 'external_sub',
				'id.token.claim': true,
				'access.token.claim': true,
				'claim.name': 'external_sub',
			},
		};
	}
}
