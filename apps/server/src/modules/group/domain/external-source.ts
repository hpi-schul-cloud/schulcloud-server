export class ExternalSource {
	externalId: string;

	systemId: string;

	lastSyncedAt: Date;

	constructor(props: ExternalSource) {
		this.externalId = props.externalId;
		this.systemId = props.systemId;
		this.lastSyncedAt = props.lastSyncedAt;
	}
}
