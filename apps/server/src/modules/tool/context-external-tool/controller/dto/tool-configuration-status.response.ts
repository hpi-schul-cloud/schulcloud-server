import { ApiProperty } from '@nestjs/swagger';

export class ToolConfigurationStatusResponse {
	@ApiProperty()
	latest: boolean;

	@ApiProperty()
	isDisabled: boolean;

	@ApiProperty()
	isOutdatedOnScopeSchool: boolean;

	@ApiProperty()
	isOutdatedOnScopeContext: boolean;

	@ApiProperty()
	isUnkown: boolean;

	constructor(props: ToolConfigurationStatusResponse) {
		this.latest = props.latest;
		this.isDisabled = props.isDisabled;
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isUnkown = props.isUnkown;
	}
}
