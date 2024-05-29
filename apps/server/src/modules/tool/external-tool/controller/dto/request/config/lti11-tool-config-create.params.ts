import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsLocale, IsString, IsUrl } from 'class-validator';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Lti11ToolConfigCreateParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty({ enum: ToolConfigType, enumName: 'ToolConfigType' })
	type!: ToolConfigType;

	@IsUrl({ require_protocol: true, protocols: ['https'] })
	@ApiProperty()
	baseUrl!: string;

	@IsString()
	@ApiProperty()
	key!: string;

	@IsString()
	@ApiProperty()
	secret!: string;

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
