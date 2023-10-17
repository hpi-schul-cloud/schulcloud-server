import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig, OauthConfig, OidcConfig } from '../type';

export class SystemDto {
	constructor({
		id,
		type,
		url,
		alias,
		displayName,
		oauthConfig,
		oidcConfig,
		ldapConfig,
		provisioningStrategy,
		provisioningUrl,
	}: SystemDto) {
		this.id = id;
		this.type = type;
		this.url = url;
		this.alias = alias;
		this.displayName = displayName;
		this.oauthConfig = oauthConfig;
		this.oidcConfig = oidcConfig;
		this.ldapConfig = ldapConfig;
		this.provisioningStrategy = provisioningStrategy;
		this.provisioningUrl = provisioningUrl;
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
