export class ExternalClassDto {
	public readonly externalId: string;

	public readonly erwinId?: string;

	public readonly name?: string;

	public readonly gradeLevel?: number;

	constructor(props: Readonly<ExternalClassDto>) {
		this.externalId = props.externalId;
		this.erwinId = props.erwinId;
		this.name = props.name;
		this.gradeLevel = props.gradeLevel;
	}
}
