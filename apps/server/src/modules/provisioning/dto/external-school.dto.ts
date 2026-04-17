export class ExternalSchoolDto {
	public externalId: string;

	public erwinId?: string;

	public name?: string;

	public officialSchoolNumber?: string;

	public location?: string;

	constructor(props: ExternalSchoolDto) {
		this.externalId = props.externalId;
		this.erwinId = props.erwinId;
		this.name = props.name;
		this.officialSchoolNumber = props.officialSchoolNumber;
		this.location = props.location;
	}
}
