import { LdapConfig, OauthConfig } from '@modules/system';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
		this.ldapConfig = props.ldapConfig;
		this.oauthConfig = props.oauthConfig;
	}
}
