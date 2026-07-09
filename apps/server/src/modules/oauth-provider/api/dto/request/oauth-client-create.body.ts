import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubjectTypeEnum, TokenAuthMethod } from '../../../domain/interface';

export class OauthClientCreateBody {
	@IsString()
	@ApiProperty({ description: 'The Oauth2 client id.', nullable: false })
	client_id!: string;

	@IsString()
	@ApiProperty({ description: 'The Oauth2 client name.', nullable: false })
	client_name!: string;

	@IsString()
	@ApiProperty({ description: 'The Oauth2 client secret.', nullable: false })
	client_secret!: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiPropertyOptional({ description: 'The allowed redirect urls of the Oauth2 client.', nullable: false, default: [] })
	redirect_uris?: string[];

	@IsEnum(TokenAuthMethod)
	@ApiProperty({
		description:
			'Requested Client Authentication method for the Token Endpoint. The options are client_secret_post, client_secret_basic, private_key_jwt, and none.',
		nullable: false,
	})
	token_endpoint_auth_method!: TokenAuthMethod;

	@IsEnum(SubjectTypeEnum)
	@ApiProperty({
		description:
			'SubjectType requested for responses to this Client. The subject_types_supported Discovery parameter contains a list of the supported subject_type values for this server. Valid types include pairwise and public.',
		nullable: false,
	})
	subject_type!: SubjectTypeEnum;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description:
			'Scope is a string containing a space-separated list of scope values (as described in Section 3.3 of OAuth 2.0 [RFC6749]) that the client can use when requesting access tokens.',
		nullable: false,
		default: 'openid offline',
	})
	scope?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Thr frontchannel logout uri.',
		nullable: false,
	})
	frontchannel_logout_uri?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiPropertyOptional({
		description: 'The grant types of the Oauth2 client.',
		nullable: false,
		default: ['authorization_code', 'refresh_token'],
	})
	grant_types?: string[];

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiPropertyOptional({
		description: 'The response types of the Oauth2 client.',
		nullable: false,
		default: ['code', 'token', 'id_token'],
	})
	response_types?: string[];
}
