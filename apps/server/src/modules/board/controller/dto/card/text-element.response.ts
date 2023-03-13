import { ApiProperty } from '@nestjs/swagger';

export class TextElementResponse {
	constructor({ id, text }: TextElementResponse) {
		this.id = id;
		this.text = text;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	text: string;
}
