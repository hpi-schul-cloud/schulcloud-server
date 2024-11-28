export class LinkElementContentDto {
	url: string;

	title: string;

	description?: string;

	imageUrl?: string;

	constructor(url: string, title: string, description: string, imageUrl?: string) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
	}
}
