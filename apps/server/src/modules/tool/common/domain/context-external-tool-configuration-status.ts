export class ContextExternalToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	isIncompleteOnScopeContext: boolean;

	isDeactivated: boolean;

	isNotLicensed: boolean;

	isIncompleteOperationalOnScopeContext: boolean;

	constructor(props: ContextExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isIncompleteOnScopeContext = props.isIncompleteOnScopeContext;
		this.isIncompleteOperationalOnScopeContext = props.isIncompleteOperationalOnScopeContext;
		this.isDeactivated = props.isDeactivated;
		this.isNotLicensed = props.isNotLicensed;
	}
}
