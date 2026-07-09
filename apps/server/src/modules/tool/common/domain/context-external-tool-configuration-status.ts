export class ContextExternalToolConfigurationStatus {
	public isOutdatedOnScopeSchool: boolean;

	public isOutdatedOnScopeContext: boolean;

	public isIncompleteOnScopeContext: boolean;

	public isDeactivated: boolean;

	public isNotLicensed: boolean;

	public isIncompleteOperationalOnScopeContext: boolean;

	constructor(props: ContextExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
		this.isIncompleteOnScopeContext = props.isIncompleteOnScopeContext;
		this.isIncompleteOperationalOnScopeContext = props.isIncompleteOperationalOnScopeContext;
		this.isDeactivated = props.isDeactivated;
		this.isNotLicensed = props.isNotLicensed;
	}
}
