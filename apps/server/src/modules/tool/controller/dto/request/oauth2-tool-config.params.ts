import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class Oauth2ToolConfigParams extends ExternalToolConfigCreateParams {
	@IsString()
	@ApiProperty()
	clientId!: string;

	@IsString()
	@ApiProperty()
	clientSecret!: string;

	@IsString()
	@ApiProperty()
	skipConsent!: boolean;

	@IsString()
	@ApiProperty()
	frontchannelLogoutUrl?: string;
}
