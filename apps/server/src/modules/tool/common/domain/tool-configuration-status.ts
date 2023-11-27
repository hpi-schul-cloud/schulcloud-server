import { ApiProperty } from '@nestjs/swagger';

export class ToolConfigurationStatus {
	@ApiProperty({ default: false })
	isDisabled: boolean;

	@ApiProperty({ default: false })
	isOutdatedOnScopeSchool: boolean;

	@ApiProperty({ default: false })
	isOutdatedOnScopeContext: boolean;

	constructor(props: ToolConfigurationStatus) {
		this.isDisabled = props.isDisabled;
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
	}
}
