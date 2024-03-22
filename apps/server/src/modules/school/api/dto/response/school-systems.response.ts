import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LdapConfig, OauthConfig } from '@src/modules/system';

export class ProviderConfigResponse {
	@ApiProperty()
	provider?: string;

	constructor(props: Partial<LdapConfig> | Partial<OauthConfig>) {
		this.provider = props.provider;
	}
}

export class SchoolSystemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	type: string;

	@ApiPropertyOptional()
	alias?: string;

	@ApiPropertyOptional({ type: ProviderConfigResponse })
	ldapConfig?: ProviderConfigResponse;

	@ApiPropertyOptional({ type: ProviderConfigResponse })
	oauthConfig?: ProviderConfigResponse;

	constructor(props: SchoolSystemResponse) {
		this.id = props.id;
		this.type = props.type;
		this.alias = props.alias;
		this.ldapConfig = props.ldapConfig ? new ProviderConfigResponse(props.ldapConfig) : undefined;
		this.oauthConfig = props.oauthConfig ? new ProviderConfigResponse(props.oauthConfig) : undefined;
	}
}
