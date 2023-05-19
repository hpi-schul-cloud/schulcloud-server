export class PublicSchoolResponse {
	schoolName: string;

	schoolNumber: string;

	oauthMigrationPossible: boolean;

	oauthMigrationMandatory: boolean;

	constructor(params: PublicSchoolResponse) {
		this.schoolName = params.schoolName;
		this.schoolNumber = params.schoolNumber;
		this.oauthMigrationPossible = params.oauthMigrationPossible;
		this.oauthMigrationMandatory = params.oauthMigrationMandatory;
	}
}
