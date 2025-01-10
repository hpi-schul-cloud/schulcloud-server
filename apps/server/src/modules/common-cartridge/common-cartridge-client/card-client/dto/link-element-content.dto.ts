export class LinkElementContentDto {
	public url: string;

	public title: string;

	public description?: string;

	public imageUrl?: string;

	constructor(props: Readonly<LinkElementContentDto>) {
		this.url = props.url;
		this.title = props.title;
		this.description = props.description;
		this.imageUrl = props.imageUrl;
	}
}
