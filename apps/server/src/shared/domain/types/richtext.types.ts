import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { sanitizeRichText } from '@shared/controller';

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
