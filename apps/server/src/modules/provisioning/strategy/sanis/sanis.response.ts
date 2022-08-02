export class SanisResponse {
	constructor(placeholderResponse: SanisResponse) {
		this.pid = placeholderResponse.pid;
		this.person = placeholderResponse.person;
		this.personenkontexte = placeholderResponse.personenkontexte;
	}

	email: string;

	firstName: string;

	lastName: string;

	schoolName: string;

	userRoles: string[];
}
