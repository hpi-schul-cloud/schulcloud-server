import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from './input-format.types';
import { sanitizeRichText } from '../../controller/transformer/sanitize-html.transformer';

export class RichText {
	constructor({ content, type }: RichText) {
		this.content = sanitizeRichText(content, type);
		this.type = type;
	}

	@ApiProperty()
	content: string;

	@ApiProperty({
		enum: InputFormat,
	})
	type: InputFormat;
}
