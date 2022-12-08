import { ApiProperty } from '@nestjs/swagger';
import { CardElementType } from '@shared/domain/entity/cardElement.entity';
import { CardTitleElementResponse } from './card-title-element.response';
import { CardRichTextElementResponse } from './card-richtext-element.response';

export class CardElementResponse {
	@ApiProperty({
		description: 'Type of element',
		enum: CardElementType,
	})
	cardElementType!: CardElementType;

	@ApiProperty({
		description: 'Content of the element',
	})
	content!: CardTitleElementResponse | CardRichTextElementResponse;
}
