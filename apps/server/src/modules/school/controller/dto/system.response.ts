import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig, OauthConfig, OidcConfig } from '../../domain';

export class SystemResponse {
	constructor({
		type,
		url,
		alias,
		displayName,
		oauthConfig,
		oidcConfig,
		ldapConfig,
		provisioningStrategy,
		provisioningUrl,
	}: SystemResponse) {
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

	@ApiProperty()
	type: string;

	@ApiPropertyOptional()
	url?: string;

	@ApiPropertyOptional()
	alias?: string;

	@ApiPropertyOptional()
	displayName?: string;

	@ApiPropertyOptional()
	oauthConfig?: OauthConfig;

	@ApiPropertyOptional()
	oidcConfig?: OidcConfig;

	@ApiPropertyOptional()
	ldapConfig?: LdapConfig;

	@ApiPropertyOptional()
	provisioningStrategy?: SystemProvisioningStrategy;

	@ApiPropertyOptional()
	provisioningUrl?: string;
}
