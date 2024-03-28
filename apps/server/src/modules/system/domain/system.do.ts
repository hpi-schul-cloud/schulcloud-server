import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig } from './ldap-config';
import { OauthConfig } from './oauth-config';
import { SystemType } from './system-type.enum';

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
	get type(): SystemType | string {
		return this.props.type;
	}

	get ldapConfig(): LdapConfig | undefined {
		return this.props.ldapConfig;
	}

	get provisioningStrategy(): SystemProvisioningStrategy | undefined {
		return this.props.provisioningStrategy;
	}

	public isDeletable(): boolean {
		const isDeletable = this.ldapConfig?.provider === 'general';

		return isDeletable;
	}
}
