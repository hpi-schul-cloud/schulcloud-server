import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsLocale, IsOptional, IsString, IsUrl } from 'class-validator';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Lti11ToolConfigUpdateParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty({ enum: ToolConfigType, enumName: 'ToolConfigType' })
	type!: ToolConfigType;

	@IsUrl(
		{ require_protocol: true, protocols: ['https'] },
		{ message: 'baseUrl must be a URL address with https protocol' }
	)
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
	@ApiProperty({ enum: LtiMessageType, enumName: 'LtiMessageType' })
	lti_message_type!: LtiMessageType;

	@IsEnum(LtiPrivacyPermission)
	@ApiProperty({ enum: LtiPrivacyPermission, enumName: 'LtiPrivacyPermission' })
	privacy_permission!: LtiPrivacyPermission;

	@IsLocale()
	@ApiProperty()
	launch_presentation_locale!: string;
}
