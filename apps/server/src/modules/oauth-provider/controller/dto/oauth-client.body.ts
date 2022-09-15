import { IsArray, IsString } from 'class-validator';

export class OauthClientBody {
	@IsString()
	client_id?: string;

	@IsString()
	client_name?: string;

	@IsString()
	client_secret?: string;

	@IsArray()
	@IsString({ each: true })
	redirect_uris?: string[];

	@IsString()
	token_endpoint_auth_method?: string;

	@IsString()
	subject_type?: string;

	@IsString()
	scope?: string;
}
