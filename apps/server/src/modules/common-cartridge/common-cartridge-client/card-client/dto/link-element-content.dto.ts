export class LinkElementContentDto {
	url: string;

	title: string;

	description?: string;

	imageUrl?: string;

	constructor(props: Readonly<LinkElementContentDto>) {
		this.url = props.url;
		this.title = props.title;
		this.description = props.description;
		this.imageUrl = props.imageUrl;
	}
}
