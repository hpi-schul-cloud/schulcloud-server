export class ExternalSchoolDto {
	externalId: string;

	name?: string;

	officialSchoolNumber?: string;

	location?: string;

	constructor(props: ExternalSchoolDto) {
		this.externalId = props.externalId;
		this.name = props.name;
		this.officialSchoolNumber = props.officialSchoolNumber;
		this.location = props.location;
	}
}
