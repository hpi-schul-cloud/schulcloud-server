import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/interface';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Lti11ToolConfigUpdateParams extends ExternalToolConfigCreateParams {
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
	@IsOptional()
	@ApiPropertyOptional()
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
