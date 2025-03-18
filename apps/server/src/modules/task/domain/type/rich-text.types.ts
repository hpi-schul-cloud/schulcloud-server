import { ApiProperty } from '@nestjs/swagger';
import { sanitizeRichText } from '@shared/controller/transformer/sanitize-html.transformer';
import { InputFormat } from '@shared/domain/types/input-format.types';

export class RichText {
	constructor({ content, type }: RichText) {
		this.content = sanitizeRichText(content, type);
		this.type = type;
	}

	@ApiProperty({
		description: 'Content of the rich text element',
	})
	content: string;

	@ApiProperty({
		description: 'Input format of the rich text element',
		enum: InputFormat,
	})
	type: InputFormat;
}
