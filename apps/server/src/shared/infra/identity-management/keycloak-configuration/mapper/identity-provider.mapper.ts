import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Inject } from '@nestjs/common';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { OidcConfigDto } from '@src/modules/system/service';

export class OidcIdentityProviderMapper {
	constructor(@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: IEncryptionService) {}

	public mapToKeycloakIdentityProvider(oidcConfig: OidcConfigDto, flowAlias: string): IdentityProviderRepresentation {
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
