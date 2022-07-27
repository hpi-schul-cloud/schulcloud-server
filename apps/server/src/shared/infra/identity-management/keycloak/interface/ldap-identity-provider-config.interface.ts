import { SysType } from '../../sys.type';
import { IIdentityProviderConfig } from './identity-provider-config.interface';

export interface ILdapIdentityProviderConfig extends IIdentityProviderConfig {
	type: SysType.LDAP;
}
