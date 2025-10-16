import { ExternalToolMediumStatus } from '../enum';

export interface ExternalToolMediumProps {
	status: ExternalToolMediumStatus;

	mediumId?: string;

	publisher?: string;

	mediaSourceId?: string;

	metadataModifiedAt?: Date;
}

export class ExternalToolMedium {
	public status: ExternalToolMediumStatus;

	public mediumId?: string;

	public publisher?: string;

	public mediaSourceId?: string;

	public metadataModifiedAt?: Date;

	constructor(props: ExternalToolMediumProps) {
		this.status = props.status;
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.mediaSourceId = props.mediaSourceId;
		this.metadataModifiedAt = props.metadataModifiedAt;
	}
}
