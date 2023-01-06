import { SystemTypeEnum } from '@shared/domain';
import { IIdentityProviderConfig } from './identity-provider-config.interface';

export interface ILdapIdentityProviderConfig extends IIdentityProviderConfig {
	type: SystemTypeEnum.LDAP;
}
