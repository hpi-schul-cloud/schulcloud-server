import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types/input-format.types';

export class RichText {
	constructor({ content, type }: RichText) {
		this.content = content || '';
		this.type = type || InputFormat.PLAIN_TEXT;
	}

	@ApiProperty()
	content: string;

	@ApiProperty({
		enum: InputFormat,
	})
	type: InputFormat;
}

