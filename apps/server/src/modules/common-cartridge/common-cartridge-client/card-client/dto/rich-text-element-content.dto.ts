export class RichTextElementContentDto {
	text: string;

	inputFormat: string;

	constructor(text: string, inputFormat: string) {
		this.text = text;
		this.inputFormat = inputFormat;
	}
}
