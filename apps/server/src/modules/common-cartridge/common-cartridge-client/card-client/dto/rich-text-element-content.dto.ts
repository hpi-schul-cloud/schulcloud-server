export class RichTextElementContentDto {
	public text: string;

	public inputFormat: string;

	constructor(text: string, inputFormat: string) {
		this.text = text;
		this.inputFormat = inputFormat;
	}
}
