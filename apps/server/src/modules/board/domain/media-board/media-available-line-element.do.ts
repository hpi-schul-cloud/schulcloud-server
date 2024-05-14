// TODO
export class MediaAvailableLineElement {
	schoolExternalToolId: string;

	name: string;

	description?: string;

	logoUrl?: string;

	constructor(props: MediaAvailableLineElementProps) {
		this.schoolExternalToolId = props.schoolExternalToolId;
		this.name = props.name;
		this.description = props.description;
		this.logoUrl = props.logoUrl;
	}
}

export interface MediaAvailableLineElementProps {
	schoolExternalToolId: string;
	name: string;
	description?: string;
	logoUrl?: string;
}
