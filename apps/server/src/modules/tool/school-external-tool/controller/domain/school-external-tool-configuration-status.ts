export class SchoolExternalToolConfigurationStatus {
	isOutdatedOnScopeSchool: boolean;

	isDeactivated: boolean;

	constructor(props: SchoolExternalToolConfigurationStatus) {
		this.isOutdatedOnScopeSchool = props.isOutdatedOnScopeSchool;
		this.isDeactivated = props.isDeactivated;
	}
}
