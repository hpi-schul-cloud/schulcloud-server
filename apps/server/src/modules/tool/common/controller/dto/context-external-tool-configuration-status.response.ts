import { ApiProperty } from '@nestjs/swagger';

export class ContextExternalToolConfigurationStatusResponse {
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

	@ApiProperty({
		type: Boolean,
		description: 'true, if a configured parameter on the context external tool is missing a value',
	})
	isIncompleteOnScopeContext: boolean;

	constructor(props: ContextExternalToolConfigurationStatusResponse) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isIncompleteOnScopeContext = props.isIncompleteOnScopeContext;
	}
}
