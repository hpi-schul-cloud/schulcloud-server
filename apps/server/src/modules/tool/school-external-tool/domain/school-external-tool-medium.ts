export class SchoolExternalToolMedium {
	public mediumId: string;

	public mediaSourceId?: string;

	public mediaSourceName?: string;

	constructor(props: SchoolExternalToolMedium) {
		this.mediaSourceName = props.mediaSourceName;
		this.mediumId = props.mediumId;
		this.mediaSourceId = props.mediaSourceId;
	}
}
