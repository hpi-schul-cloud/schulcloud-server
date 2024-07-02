import { ApiProperty } from '@nestjs/swagger';

export class SchoolExternalToolConfigurationStatusResponse {
	@ApiProperty({
		type: Boolean,
		description:
			'Is the tool outdated on school scope, because of non matching versions or required parameter changes on ExternalTool?',
	})
	isOutdatedOnScopeSchool: boolean;

	@ApiProperty({
		type: Boolean,
		description: 'Is the tool deactivated, because of instance administrator?',
	})
	isGloballyDeactivated: boolean;

	constructor(props: SchoolExternalToolConfigurationStatusResponse) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isGloballyDeactivated = props.isGloballyDeactivated;
	}
}
