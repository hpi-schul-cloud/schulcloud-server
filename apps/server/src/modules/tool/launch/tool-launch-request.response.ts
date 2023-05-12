import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LaunchRequestMethod } from '@shared/domain';

export class ToolLaunchRequestResponse {
	@ApiProperty({
		description: 'The Launch Request method (GET or POST)',
		enum: LaunchRequestMethod,
		example: LaunchRequestMethod.GET,
	})
	method!: LaunchRequestMethod;

	@ApiProperty({
		description: 'The URL for the Tool Launch Request',
		example: 'https://example.com/tool-launch',
	})
	url!: string;

	@ApiProperty({
		description: 'The payload for the Tool Launch Request (optional)',
		example: '{ "key": "value" }',
		required: false,
	})
	@ApiPropertyOptional()
	payload?: string;

	constructor(props: ToolLaunchRequestResponse) {
		this.url = props.url;
		this.method = props.method;
		this.payload = props.payload;
	}
}
