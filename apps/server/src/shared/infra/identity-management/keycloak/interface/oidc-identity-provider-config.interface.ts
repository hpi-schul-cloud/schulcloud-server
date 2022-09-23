import { SystemTypeEnum } from '@shared/domain';
import { IIdentityProviderConfig } from './identity-provider-config.interface';

export interface IOidcIdentityProviderConfig extends IIdentityProviderConfig {
	type: SystemTypeEnum.OIDC;
	config: {
		clientId: string;
		clientSecret: string;
		authorizationUrl: string;
		tokenUrl: string;
		logoutUrl: string;
		userinfoUrl: string;
		defaultScopes: string;
	};
}
