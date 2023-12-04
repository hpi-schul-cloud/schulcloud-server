export class ContextExternalToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isOutdatedOnScopeContext: boolean;

	constructor(props: ContextExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isOutdatedOnScopeContext = props.isOutdatedOnScopeContext;
	}
}
