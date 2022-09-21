import { ApiProperty } from '@nestjs/swagger';

export class OauthClientResponse {
	constructor(response: OauthClientResponse) {
		this.client_id = response.client_id;
		this.client_name = response.client_name;
		this.client_secret = response.client_secret;
		this.redirect_uris = response.redirect_uris;
		this.token_endpoint_auth_method = response.token_endpoint_auth_method;
		this.subject_type = response.subject_type;
		this.scope = response.scope;
		this.frontchannel_logout_uri = response.frontchannel_logout_uri;
		this.grant_types = response.grant_types;
		this.response_types = response.response_types;
	}

	@ApiProperty()
	client_id?: string;

	@ApiProperty()
	client_name?: string;

	@ApiProperty()
	client_secret?: string;

	@ApiProperty()
	redirect_uris?: string[];

	@ApiProperty()
	token_endpoint_auth_method?: string;

	@ApiProperty()
	subject_type?: string;

	@ApiProperty()
	scope?: string;

	@ApiProperty()
	frontchannel_logout_uri?: string;

	@ApiProperty()
	grant_types?: string[];

	@ApiProperty()
	response_types?: string[];
}
