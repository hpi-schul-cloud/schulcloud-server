export interface ExternalToolMediumProps {
	mediumId: string;

	publisher?: string;

	sourceId?: string;
}

export class ExternalToolMedium {
	mediumId: string;

	publisher?: string;

	sourceId?: string;

	constructor(props: ExternalToolMediumProps) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
		this.sourceId = props.sourceId;
	}
}
