export class ExternalSource {
	public externalId: string;

	public systemId: string;

	public lastSyncedAt: Date;

	constructor(props: ExternalSource) {
		this.externalId = props.externalId;
		this.systemId = props.systemId;
		this.lastSyncedAt = props.lastSyncedAt;
	}
}
