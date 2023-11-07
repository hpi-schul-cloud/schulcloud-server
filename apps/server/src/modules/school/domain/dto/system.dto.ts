import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig, OauthConfig, OidcConfig } from '../type';

export class SystemDto {
	constructor(props: SystemDto) {
		this.id = props.id;
		this.type = props.type;
		this.url = props.url;
		this.alias = props.alias;
		this.displayName = props.displayName;
		this.oauthConfig = props.oauthConfig;
		this.oidcConfig = props.oidcConfig;
		this.ldapConfig = props.ldapConfig;
		this.provisioningStrategy = props.provisioningStrategy;
		this.provisioningUrl = props.provisioningUrl;
	}

	id: string;

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
