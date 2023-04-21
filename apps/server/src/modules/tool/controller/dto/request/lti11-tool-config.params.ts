import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../interface';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Lti11ToolConfigParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty()
	type!: ToolConfigType;

	@IsString()
	@ApiProperty()
	baseUrl!: string;

	@IsString()
	@ApiProperty()
	key!: string;

	@IsString()
	@ApiProperty()
	secret?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	resource_link_id?: string;

	@IsEnum(LtiMessageType)
	@ApiProperty()
	lti_message_type!: LtiMessageType;

	@IsEnum(LtiPrivacyPermission)
	@ApiProperty()
	privacy_permission!: LtiPrivacyPermission;
}
