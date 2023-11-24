export class ToolConfigurationStatus {
	isDisabled: boolean;

	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	constructor(props: ToolConfigurationStatus) {
		this.isDisabled = props.isDisabled;
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
	}
}
