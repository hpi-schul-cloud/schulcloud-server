export class MediaAvailableLineElement {
	schoolExternalToolId: string;

	name: string;

	description?: string;

	logoUrl?: string;

	thumbnailUrl?: string;

	constructor(props: MediaAvailableLineElementProps) {
		this.schoolExternalToolId = props.schoolExternalToolId;
		this.name = props.name;
		this.description = props.description;
		this.logoUrl = props.logoUrl;
		this.thumbnailUrl = props.thumbnailUrl;
	}
}

export interface MediaAvailableLineElementProps {
	schoolExternalToolId: string;
	name: string;
	description?: string;
	logoUrl?: string;
	thumbnailUrl?: string;
}
