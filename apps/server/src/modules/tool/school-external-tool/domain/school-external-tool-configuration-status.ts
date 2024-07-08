export class SchoolExternalToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isGloballyDeactivated: boolean;

	constructor(props: SchoolExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isGloballyDeactivated = props.isGloballyDeactivated;
	}
}
