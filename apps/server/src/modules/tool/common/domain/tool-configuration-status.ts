export class ToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	constructor(props: ToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
	}
}
