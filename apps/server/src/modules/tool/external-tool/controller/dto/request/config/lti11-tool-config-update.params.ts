import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsLocale, IsOptional, IsString, IsUrl } from 'class-validator';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Lti11ToolConfigUpdateParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty({
		enum: ToolConfigType,
		enumName: 'ToolConfigType',
		description: 'Configuration type of the tool.',
		example: ToolConfigType.LTI11,
	})
	public type!: ToolConfigType;

	@IsUrl(
		{ require_protocol: true, protocols: ['https'] },
		{ message: 'baseUrl must be a URL address with https protocol' }
	)
	@ApiProperty({
		description:
			'Defines the target URL that is launched. Can be automatically filled with parameter values when using : in-front of the parameter name. Must be HTTPS.',
		example: 'https://example.com/:parameter1/test',
	})
	public baseUrl!: string;

	@IsString()
	@ApiProperty({
		description: 'LTI 1.1 encryption key.',
	})
	public key!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'LTI 1.1 encryption secret.',
	})
	public secret?: string;

	@IsEnum(LtiMessageType)
	@ApiProperty({
		enum: LtiMessageType,
		enumName: 'LtiMessageType',
		description: 'LTI 1.1 message type.',
		example: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
	})
	public lti_message_type!: LtiMessageType;

	@IsEnum(LtiPrivacyPermission)
	@ApiProperty({
		enum: LtiPrivacyPermission,
		enumName: 'LtiPrivacyPermission',
		description: 'Describes the amount of personal information that the tool provider gets.',
		example: LtiPrivacyPermission.ANONYMOUS,
	})
	public privacy_permission!: LtiPrivacyPermission;

	@IsLocale()
	@ApiProperty({
		description: 'LTI 1.1 requested language.',
		example: 'de-DE',
	})
	public launch_presentation_locale!: string;
}
