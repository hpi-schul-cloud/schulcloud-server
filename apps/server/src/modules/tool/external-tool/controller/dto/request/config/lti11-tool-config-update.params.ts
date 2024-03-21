import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsLocale, IsOptional, IsString } from 'class-validator';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/enum';
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

	@IsEnum(LtiMessageType)
	@ApiProperty()
	lti_message_type!: LtiMessageType;

	@IsEnum(LtiPrivacyPermission)
	@ApiProperty()
	privacy_permission!: LtiPrivacyPermission;

	@IsLocale()
	@ApiProperty()
	launch_presentation_locale!: string;
}
