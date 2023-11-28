import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig } from './ldap-config';
import { OauthConfig } from './oauth-config';

export interface SystemProps extends AuthorizableObject {
	type: string;

	url?: string;

	alias?: string;

	displayName?: string;

	provisioningStrategy?: SystemProvisioningStrategy;

	provisioningUrl?: string;

	oauthConfig?: OauthConfig;

	ldapConfig?: LdapConfig;
}

export class System extends DomainObject<SystemProps> {
	get ldapConfig(): LdapConfig | undefined {
		return this.props.ldapConfig;
	}
}
