import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';

export class PlaceholderResponse implements IProviderResponse {
	constructor(placeholderResponse: PlaceholderResponse) {
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
