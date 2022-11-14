import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Lti11ToolConfigParams extends ExternalToolConfigCreateParams {
	@IsString()
	@ApiProperty()
	type!: string;

	@IsString()
	@ApiProperty()
	baseUrl!: string;

	@IsString()
	@ApiProperty()
	key!: string;

	@IsString()
	@ApiProperty()
	secret!: string;

	@IsString()
	@ApiProperty()
	resource_link_id!: string;

	@IsEnum(LtiMessageType)
	@ApiProperty()
	lti_message_type!: LtiMessageType;
}
