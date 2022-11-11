import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Lti11ToolConfigParams extends ExternalToolConfigCreateParams {
	@IsString()
	@ApiProperty()
	key!: string;

	@IsString()
	@ApiProperty()
	secret!: string;

	@IsString()
	@ApiProperty()
	resource_link?: string;

	@IsEnum(LtiMessageType)
	@ApiProperty()
	lti_message_type!: LtiMessageType;

	@IsEnum(LtiRole)
	@ApiProperty()
	roles!: LtiRole[];

	@IsString()
	@ApiProperty()
	launch_presentation_locale!: string;

	@IsString()
	@ApiProperty()
	launch_presentation_document_target!: string;
}
