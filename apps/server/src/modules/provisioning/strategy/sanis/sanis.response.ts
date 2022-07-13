export class SanisResponse {
	constructor(placeholderResponse: SanisResponse) {
		this.email = placeholderResponse.email;
		this.firstName = placeholderResponse.firstName;
		this.lastName = placeholderResponse.lastName;
		this.schoolName = placeholderResponse.schoolName;
		this.userRoles = placeholderResponse.userRoles;
	}

	email: string;

	firstName: string;

	lastName: string;

	schoolName: string;

	userRoles: string[];
}
