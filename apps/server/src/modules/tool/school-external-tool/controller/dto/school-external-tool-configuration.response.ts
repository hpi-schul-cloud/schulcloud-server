import { ApiProperty } from '@nestjs/swagger';

export class SchoolToolConfigurationStatusResponse {
	@ApiProperty({
		type: Boolean,
		description:
			'Is the tool outdated on school scope, because of non matching versions or required parameter changes on ExternalTool?',
	})
	isOutdatedOnScopeSchool: boolean;

	constructor(props: SchoolToolConfigurationStatusResponse) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
	}
}
