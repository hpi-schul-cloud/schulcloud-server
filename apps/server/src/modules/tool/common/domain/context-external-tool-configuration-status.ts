export class ContextExternalToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	isIncompleteOnScopeContext: boolean;

	constructor(props: ContextExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isIncompleteOnScopeContext = props.isIncompleteOnScopeContext;
	}
}
