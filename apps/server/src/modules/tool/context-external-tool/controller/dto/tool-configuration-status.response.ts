import { ApiProperty } from '@nestjs/swagger';

export class ToolConfigurationStatusResponse {
	@ApiProperty({ type: Boolean, description: 'Is the tool disabled for context?' })
	isDisabled: boolean;

	@ApiProperty({
		type: Boolean,
		description:
			'Is the tool outdated on school scope, because of non matching versions or required parameter changes on ExternalTool?',
	})
	isOutdatedOnScopeSchool: boolean;

	@ApiProperty({
		type: Boolean,
		description:
			'Is the tool outdated on context scope, because of non matching versions or required parameter changes on SchoolExternalTool?',
	})
	isOutdatedOnScopeContext: boolean;

	constructor(props: ToolConfigurationStatusResponse) {
		this.isDisabled = props.isDisabled;
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
	}
}
