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
			enabled: true,
			firstBrokerLoginFlowAlias: flowAlias,
			config: {
				clientId: this.defaultEncryptionService.decrypt(system.config.clientId),
				clientSecret: this.defaultEncryptionService.decrypt(system.config.clientSecret),
				authorizationUrl: system.config.authorizationUrl,
				tokenUrl: system.config.tokenUrl,
				logoutUrl: system.config.logoutUrl,
				userInfoUrl: system.config.userinfoUrl,
				defaultScope: system.config.defaultScopes,
				syncMode: 'IMPORT',
				sync_mode: 'import',
				clientAuthMethod: 'client_secret_post',
				backchannelSupported: 'true',
				prompt: 'login',
			},
		};
	}
}
