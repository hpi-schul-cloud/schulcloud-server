export class ExternalClassDto {
	readonly externalId: string;

	readonly erwinId?: string;

	readonly name?: string;

	readonly gradeLevel?: number;

	constructor(props: Readonly<ExternalClassDto>) {
		this.externalId = props.externalId;
		this.erwinId = props.erwinId;
		this.name = props.name;
		this.gradeLevel = props.gradeLevel;
	}
}
