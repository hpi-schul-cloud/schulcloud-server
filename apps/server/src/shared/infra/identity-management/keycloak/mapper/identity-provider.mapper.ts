import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Inject } from '@nestjs/common';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { IOidcIdentityProviderConfig } from '../interface';

export class OidcIdentityProviderMapper {
	constructor(@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: IEncryptionService) {}

	public mapToKeycloakIdentityProvider(
		system: IOidcIdentityProviderConfig,
		flowAlias: string
	): IdentityProviderRepresentation {
		return {
			providerId: system.type,
			alias: system.alias,
			displayName: system.displayName ? system.displayName : system.alias,
			enabled: true,
			firstBrokerLoginFlowAlias: flowAlias,
			config: {
				clientId: system.oidcConfig?.clientId
					? this.defaultEncryptionService.decrypt(system.oidcConfig.clientId)
					: undefined,
				clientSecret: system.oidcConfig?.clientSecret
					? this.defaultEncryptionService.decrypt(system.oidcConfig?.clientSecret)
					: undefined,
				authorizationUrl: system.oidcConfig?.authorizationUrl,
				tokenUrl: system.oidcConfig?.tokenUrl,
				logoutUrl: system.oidcConfig?.logoutUrl,
				userInfoUrl: system.oidcConfig?.userinfoUrl,
				defaultScope: system.oidcConfig?.defaultScopes,
				syncMode: 'IMPORT',
				sync_mode: 'import',
				clientAuthMethod: 'client_secret_post',
				backchannelSupported: 'true',
				prompt: 'login',
			},
		};
	}
}
