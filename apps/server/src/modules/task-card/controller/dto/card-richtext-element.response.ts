import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain';
import { RichTextCardElement } from '@shared/domain/entity/cardElement.entity';

export class CardRichTextElementResponse {
	constructor(props: RichTextCardElement) {
		this.value = props.value;
		this.inputFormat = props.inputFormat;
	}

	@ApiProperty({
		description: 'The value of the rich text',
	})
	value!: string;

	@ApiProperty({
		description: 'The input format type of the rich text',
		type: InputFormat,
	})
	inputFormat!: InputFormat;
}
