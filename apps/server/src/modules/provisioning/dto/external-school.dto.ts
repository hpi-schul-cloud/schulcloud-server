export class ExternalSchoolDto {
	externalId: string;

	name: string;

	constructor(props: ExternalSchoolDto) {
		this.externalId = props.externalId;
		this.name = props.name;
	}
}
