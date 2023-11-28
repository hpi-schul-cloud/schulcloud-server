import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { LdapConfig, OauthConfig, OidcConfig } from '../../../domain';

export class SystemResponse {
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

	constructor(props: SystemResponse) {
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
}
