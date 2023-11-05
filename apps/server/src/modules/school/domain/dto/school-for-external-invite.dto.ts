import { SchoolPurpose } from '../type';

export class SchoolForExternalInviteDto {
	constructor({ id, name, purpose }: SchoolForExternalInviteDto) {
		this.id = id;
		this.name = name;
		this.purpose = purpose;
	}

	id: string;

	name: string;

	purpose?: SchoolPurpose;
}
