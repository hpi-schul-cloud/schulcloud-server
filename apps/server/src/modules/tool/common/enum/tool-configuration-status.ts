export class ToolConfigurationStatus {
	latest: boolean;

	isDisabled: boolean;

	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	isUnkown: boolean;

	constructor(props: ToolConfigurationStatus) {
		this.latest = props.latest;
		this.isDisabled = props.isDisabled;
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isUnkown = props.isUnkown;
	}
}
