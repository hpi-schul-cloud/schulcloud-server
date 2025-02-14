export interface ExternalToolMediumProps {
	mediumId: string;

	publisher?: string;

	mediaSourceId?: string;

	metadataModifiedAt?: Date;
}

export class ExternalToolMedium {
	mediumId: string;

	publisher?: string;

	mediaSourceId?: string;

	metadataModifiedAt?: Date;

	constructor(props: ExternalToolMediumProps) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
		this.metadataModifiedAt = props.metadataModifiedAt;
	}
}
