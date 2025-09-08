export class ExternalClassDto {
	public readonly externalId: string;

	public readonly name?: string;

	public readonly gradeLevel?: number;

	constructor(props: Readonly<ExternalClassDto>) {
		this.externalId = props.externalId;
		this.name = props.name;
		this.gradeLevel = props.gradeLevel;
	}
}
