import { ApiProperty } from '@nestjs/swagger';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigResponse } from './external-tool-config.response';

export class Lti11ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty({
		enum: ToolConfigType,
		enumName: 'ToolConfigType',
		description: 'Configuration type of the tool.',
		example: ToolConfigType.LTI11,
	})
	public type: ToolConfigType;

	@ApiProperty({
		description:
			'Defines the target URL that is launched. Can be automatically filled with parameter values when using : in-front of the parameter name.',
		example: 'https://example.com/:parameter1/test',
	})
	public baseUrl: string;

	@ApiProperty({
		description: 'LTI 1.1 encryption key.',
	})
	public key: string;

	@ApiProperty({
		enum: LtiMessageType,
		enumName: 'LtiMessageType',
		description: 'LTI 1.1 message type.',
		example: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
	})
	public lti_message_type: LtiMessageType;

	@ApiProperty({
		enum: LtiPrivacyPermission,
		enumName: 'LtiPrivacyPermission',
		description: 'Describes the amount of personal information that the tool provider gets.',
		example: LtiPrivacyPermission.ANONYMOUS,
	})
	public privacy_permission: LtiPrivacyPermission;

	@ApiProperty({
		description: 'LTI 1.1 requested language.',
		example: 'de-DE',
	})
	public launch_presentation_locale: string;

	constructor(props: Lti11ToolConfigResponse) {
		super();
		this.type = ToolConfigType.LTI11;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
		this.launch_presentation_locale = props.launch_presentation_locale;
	}
}
