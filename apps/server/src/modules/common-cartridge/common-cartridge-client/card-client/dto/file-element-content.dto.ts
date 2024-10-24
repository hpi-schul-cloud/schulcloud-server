export class FileElementContentDto {
	caption: string;

	alternativeText: string;

	constructor(caption: string, alternativeText: string) {
		this.caption = caption;
		this.alternativeText = alternativeText;
	}
}
