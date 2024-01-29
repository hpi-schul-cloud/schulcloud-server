import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemTypeEnum } from '@shared/domain/types';
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

	get provisioningStrategy(): SystemProvisioningStrategy | undefined {
		return this.props.provisioningStrategy;
	}

	public isEligibleForLdapLogin(): boolean {
		// Systems with an oauthConfig are filtered out here to exclude IServ. IServ is of type LDAP for syncing purposes, but the login is done via OAuth2.
		const result =
			this.props.type === SystemTypeEnum.LDAP && !!this.props.ldapConfig?.active && !this.props.oauthConfig;

		return result;
	}
}
