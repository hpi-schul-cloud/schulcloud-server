export interface ExternalToolMediumProps {
	mediumId: string;

	publisher?: string;
}

export class ExternalToolMedium {
	mediumId: string;

	publisher?: string;

	constructor(props: ExternalToolMediumProps) {
		this.mediumId = props.mediumId;
		this.publisher = props.publisher;
	}
}
