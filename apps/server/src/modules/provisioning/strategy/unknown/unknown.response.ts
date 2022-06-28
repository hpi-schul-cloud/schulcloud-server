import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';

export class UnknownResponse implements IProviderResponse {
	constructor(unknownResponse: UnknownResponse) {
		this.email = unknownResponse.email;
		this.firstName = unknownResponse.firstName;
		this.lastName = unknownResponse.lastName;
		this.schoolName = unknownResponse.schoolName;
		this.userRoles = unknownResponse.userRoles;
	}

	email: string;

	firstName: string;

	lastName: string;

	schoolName: string;

	userRoles: string[];
}
