import { SystemTypeEnum } from '@shared/domain';
import { IIdentityProviderConfig } from './identity-provider-config.interface';

export interface IOidcIdentityProviderConfig extends IIdentityProviderConfig {
	type: SystemTypeEnum.OIDC;
}
