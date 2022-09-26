import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubjectTypeEnum } from '@src/modules/oauth-provider/interface/subject-type.enum';
import { TokenAuthMethod } from '@src/modules/oauth-provider/interface/token-auth-method.enum';

export class OauthClientBody {
	@IsString()
	@IsOptional()
	@ApiProperty({ description: 'The Oauth2 client id.', required: false, nullable: false })
	client_id?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: 'The Oauth2 client name.', required: false, nullable: false })
	client_name?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({ description: 'The Oauth2 client secret.', required: false, nullable: false })
	client_secret?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ description: 'The allowed redirect urls of the Oauth2 client.', required: false, nullable: false })
	redirect_uris?: string[];

	@IsEnum(TokenAuthMethod)
	@IsOptional()
	@ApiProperty({
		description:
			'Requested Client Authentication method for the Token Endpoint. The options are client_secret_post, client_secret_basic, private_key_jwt, and none.',
		required: false,
		nullable: false,
	})
	token_endpoint_auth_method?: TokenAuthMethod;

	@IsEnum(SubjectTypeEnum)
	@IsOptional()
	@ApiProperty({
		description:
			'SubjectType requested for responses to this Client. The subject_types_supported Discovery parameter contains a list of the supported subject_type values for this server. Valid types include pairwise and public.',
		required: false,
		nullable: false,
	})
	subject_type?: SubjectTypeEnum;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description:
			'Scope is a string containing a space-separated list of scope values (as described in Section 3.3 of OAuth 2.0 [RFC6749]) that the client can use when requesting access tokens.',
		required: false,
		nullable: false,
	})
	scope?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'Thr frontchannel logout uri.',
		required: false,
		nullable: false,
	})
	frontchannel_logout_uri?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ description: 'The grant types of the Oauth2 client.', required: false, nullable: false })
	grant_types?: string[];

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ description: 'The response types of the Oauth2 client.', required: false, nullable: false })
	response_types?: string[];
}
