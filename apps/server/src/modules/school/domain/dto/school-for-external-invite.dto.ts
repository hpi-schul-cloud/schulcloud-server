import { SchoolPurpose } from '../type';

export class SchoolForExternalInviteDto {
	constructor(props: SchoolForExternalInviteDto) {
		this.id = props.id;
		this.name = props.name;
		this.purpose = props.purpose;
	}

	id: string;

	name: string;

	purpose?: SchoolPurpose;
}
