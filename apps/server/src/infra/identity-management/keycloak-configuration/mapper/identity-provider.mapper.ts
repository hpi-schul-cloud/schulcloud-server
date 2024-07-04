import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { OidcConfig } from '@modules/system/domain';
import { Inject } from '@nestjs/common';

export class OidcIdentityProviderMapper {
	constructor(@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: EncryptionService) {}

	public mapToKeycloakIdentityProvider(oidcConfig: OidcConfig, flowAlias: string): IdentityProviderRepresentation {
		return {
			providerId: 'oidc',
			alias: oidcConfig.idpHint,
			displayName: oidcConfig.idpHint,
			enabled: true,
			firstBrokerLoginFlowAlias: flowAlias,
			config: {
				clientId: oidcConfig.clientId,
				clientSecret: this.defaultEncryptionService.decrypt(oidcConfig.clientSecret),
				authorizationUrl: oidcConfig.authorizationUrl,
				tokenUrl: oidcConfig.tokenUrl,
				logoutUrl: oidcConfig.logoutUrl,
				userInfoUrl: oidcConfig.userinfoUrl,
				defaultScope: oidcConfig.defaultScopes,
				syncMode: 'IMPORT',
				sync_mode: 'import',
				clientAuthMethod: 'client_secret_post',
				backchannelSupported: 'true',
				prompt: 'login',
			},
		};
	}
}
