import { SysType } from '../../sys.type';
import { IIdentityProviderConfig } from './identity-provider-config.interface';

export interface IOidcIdentityProviderConfig extends IIdentityProviderConfig {
	type: SysType.OIDC;
	config: {
		clientId: string;
		clientSecret: string;
		authorizationUrl: string;
		tokenUrl: string;
		logoutUrl: string;
	};
}
