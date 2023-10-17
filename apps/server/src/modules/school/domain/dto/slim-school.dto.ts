import { SchoolPurpose } from '../type';

// TODO: The prefix "Slim" is a suggestion to name objects that are a small partial of the actual object.
// Question: Should it be "SlimSchoolDto" or "SchoolSlimDto"?
export class SlimSchoolDto {
	constructor({ id, name, purpose }: SlimSchoolDto) {
		this.id = id;
		this.name = name;
		this.purpose = purpose;
	}

	id: string;

	name: string;

	purpose?: SchoolPurpose;
}
