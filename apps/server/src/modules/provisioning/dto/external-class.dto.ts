export class ExternalClassDto {
	public readonly externalId: string;

	constructor(props: Readonly<ExternalClassDto>) {
		this.externalId = props.externalId;
	}
}
