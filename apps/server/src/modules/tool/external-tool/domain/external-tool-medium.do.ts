export interface ExternalToolMediumProps {
	mediumId: string;

	publisher?: string;

	mediaSourceId?: string;
}

export class ExternalToolMedium {
	mediumId: string;

	publisher?: string;

	mediaSourceId?: string;

	constructor(props: ExternalToolMediumProps) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
	}
}
