export class ContextExternalToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	isIncompleteOnScopeContext: boolean;

	isDeactivated: boolean;

	constructor(props: ContextExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isIncompleteOnScopeContext = props.isIncompleteOnScopeContext;
		this.isDeactivated = props.isDeactivated;
	}
}
