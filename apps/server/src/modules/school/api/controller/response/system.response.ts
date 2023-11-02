import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig, OauthConfig, OidcConfig } from '../../../domain';

export class SystemResponse {
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
	}: SystemResponse) {
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

	@ApiProperty()
	id: string;

	@ApiProperty()
	type: string;

	@ApiPropertyOptional()
	url?: string;

	@ApiPropertyOptional()
	alias?: string;

	@ApiPropertyOptional()
	displayName?: string;

	// TODO: How deeply do we want to be explicit about the response types?
	// E.g. do we want an OauthConfigResponse here with all properties marked as ApiProperty?
	@ApiPropertyOptional()
	oauthConfig?: OauthConfig;

	@ApiPropertyOptional()
	oidcConfig?: OidcConfig;

	@ApiPropertyOptional()
	ldapConfig?: LdapConfig;

	@ApiPropertyOptional({ enum: SystemProvisioningStrategy, enumName: 'SystemProvisioningStrategy' })
	provisioningStrategy?: SystemProvisioningStrategy;

	@ApiPropertyOptional()
	provisioningUrl?: string;
}
