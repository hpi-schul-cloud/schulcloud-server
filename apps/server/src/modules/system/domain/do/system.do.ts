import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { type LdapConfig } from '../ldap-config';
import { type OauthConfig } from '../oauth-config';
import { type OidcConfig } from '../oidc-config';
import { type SystemType } from '../type/system-type.enum';

export interface SystemProps extends AuthorizableObject {
	type: string;

	url?: string;

	alias?: string;

	displayName?: string;

	provisioningStrategy?: SystemProvisioningStrategy;

	provisioningUrl?: string;

	oauthConfig?: OauthConfig;

	ldapConfig?: LdapConfig;

	oidcConfig?: OidcConfig;
}

export class System extends DomainObject<SystemProps> {
	get type(): SystemType | string {
		return this.props.type;
	}

	get alias(): string | undefined {
		return this.props.alias;
	}

	get displayName(): string | undefined {
		return this.props.displayName;
	}

	get ldapConfig(): LdapConfig | undefined {
		return this.props.ldapConfig;
	}

	get provisioningStrategy(): SystemProvisioningStrategy | undefined {
		return this.props.provisioningStrategy;
	}

	get provisioningUrl(): string | undefined {
		return this.props.provisioningUrl;
	}

	get oauthConfig(): OauthConfig | undefined {
		return this.props.oauthConfig;
	}

	get oidcConfig(): OidcConfig | undefined {
		return this.props.oidcConfig;
	}

	public isDeletable(): boolean {
		const isDeletable = this.ldapConfig?.provider === 'general';

		return isDeletable;
	}
}
