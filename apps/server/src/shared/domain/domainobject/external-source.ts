export class ExternalSource {
	externalId: string;

	systemId: string;

	constructor(props: ExternalSource) {
		this.externalId = props.externalId;
		this.systemId = props.systemId;
	}
}
