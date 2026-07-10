export class SchoolExternalToolConfigurationStatus {
	public isOutdatedOnScopeSchool: boolean;

	public isGloballyDeactivated: boolean;

	constructor(props: SchoolExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isGloballyDeactivated = props.isGloballyDeactivated;
	}
}
