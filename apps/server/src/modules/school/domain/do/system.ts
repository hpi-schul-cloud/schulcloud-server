import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig, OauthConfig, OidcConfig } from '../type';

// TODO: There is already a systems module. Question for the future: Should this stay separate or be integrated in the school module?
export class System extends DomainObject<SystemProps> {}

export interface SystemProps extends AuthorizableObject {
	type: string;
	url?: string;
	alias?: string;
	displayName?: string;
	oauthConfig?: OauthConfig;
	oidcConfig?: OidcConfig;
	ldapConfig?: LdapConfig;
	provisioningStrategy?: SystemProvisioningStrategy;
	provisioningUrl?: string;
}
