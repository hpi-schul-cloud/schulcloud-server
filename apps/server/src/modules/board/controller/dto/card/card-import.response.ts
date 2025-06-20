import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { CardImportParams } from './card-import.params';
import { CardResponse } from './card.response';

export class CardImportResponse {
	@ApiProperty({
		description: 'The response containing the card details after import.',
		type: CardResponse,
	})
	public cardResponse: CardResponse;
	@ApiProperty({
		description: 'array of parameters for importing data into the card.',
		type: 'array',
		items: {
			$ref: getSchemaPath(CardImportParams),
		},
	})
	public cardImportParams: CardImportParams[];

	constructor(cardResponse: CardResponse, cardImportParams: CardImportParams[]) {
		this.cardResponse = cardResponse;
		this.cardImportParams = cardImportParams;
	}
}
