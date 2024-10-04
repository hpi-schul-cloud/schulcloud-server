export class ExternalClassDto {
	public readonly externalId: string;

	public readonly name?: string;

	constructor(props: Readonly<ExternalClassDto>) {
		this.externalId = props.externalId;
		this.name = props.name;
	}
}
