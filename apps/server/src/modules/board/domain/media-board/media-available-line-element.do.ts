export class MediaAvailableLineElement {
	public schoolExternalToolId: string;

	public name: string;

	public domain: string;

	public description?: string;

	public logoUrl?: string;

	public thumbnailUrl?: string;

	constructor(props: MediaAvailableLineElementProps) {
		this.schoolExternalToolId = props.schoolExternalToolId;
		this.name = props.name;
		this.domain = props.domain;
		this.description = props.description;
		this.logoUrl = props.logoUrl;
		this.thumbnailUrl = props.thumbnailUrl;
	}
}

export interface MediaAvailableLineElementProps {
	schoolExternalToolId: string;
	name: string;
	domain: string;
	description?: string;
	logoUrl?: string;
	thumbnailUrl?: string;
}
