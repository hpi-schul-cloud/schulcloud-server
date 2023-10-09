import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Inject } from '@nestjs/common';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
// Please do not import from modules
import { OidcConfigDto } from '@src/modules/system/service';

export class OidcIdentityProviderMapper {
	constructor(@Inject(DefaultEncryptionService) private readonly defaultEncryptionService: IEncryptionService) {}

	// flowAlias: string is unspecific it can be more strict
	public mapToKeycloakIdentityProvider(oidcConfig: OidcConfigDto, flowAlias: string): IdentityProviderRepresentation {
		// write a const before
		return {
			// oidc as value do not look correctly is this a default? If yes than find a better default. If no please add commend..
			// ..for what it is used.
			providerId: 'oidc',
			alias: oidcConfig.idpHint,
			displayName: oidcConfig.idpHint,
			enabled: true,
			firstBrokerLoginFlowAlias: flowAlias,
			config: {
				clientId: oidcConfig.clientId,
				// move defaultEncryptionService.decrypt out from mapper and pass result to it
				// then the mapper can use with static method and without injection over provider
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
