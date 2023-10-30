import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LtiPrivacyPermission } from '@shared/domain/entity/ltitool.entity';
import { LtiMessageType } from '@src/modules/tool/common/enum/lti-message-type.enum';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { IsEnum, IsLocale, IsOptional, IsString } from 'class-validator';
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

	@IsLocale()
	@ApiProperty()
	launch_presentation_locale!: string;
}
