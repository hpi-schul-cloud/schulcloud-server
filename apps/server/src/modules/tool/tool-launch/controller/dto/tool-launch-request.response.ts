import { ApiProperty } from '@nestjs/swagger';
import { LaunchRequestMethod } from '../../types';

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
	payload?: string;

	@ApiProperty({
		description: 'Specifies whether the Tool should be launched in a new tab',
		example: true,
		required: false,
	})
	openNewTab?: boolean;

	@ApiProperty({
		description: 'Specifies whether the Tool should be launched in a new tab',
	})
	isDeepLink: boolean;

	constructor(props: ToolLaunchRequestResponse) {
		this.url = props.url;
		this.method = props.method;
		this.payload = props.payload;
		this.openNewTab = props.openNewTab;
		this.isDeepLink = props.isDeepLink;
	}
}
