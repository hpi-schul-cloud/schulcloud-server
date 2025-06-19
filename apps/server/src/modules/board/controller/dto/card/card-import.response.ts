import { ApiProperty } from '@nestjs/swagger';
import { CardImportParams } from './card-import.params';
import { CardResponse } from './card.response';

export class CardImportResponse {
	@ApiProperty({
		description: 'The response containing the card details after import.',
		type: CardResponse,
	})
	public cardResponse: CardResponse;
	@ApiProperty({
		description: 'Parameters for importing data into the card.',
		type: CardImportParams,
	})
	public cardImportParams: CardImportParams[];

	constructor(cardResponse: CardResponse, cardImportParams: CardImportParams[]) {
		this.cardResponse = cardResponse;
		this.cardImportParams = cardImportParams;
	}
}
