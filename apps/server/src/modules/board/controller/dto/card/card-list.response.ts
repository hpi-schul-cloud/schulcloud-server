import { ApiProperty } from '@nestjs/swagger';
import { CardResponse } from './card.response';

// TODO change this to ListCardResponse
export class CardListResponse {
	constructor({ data }: CardListResponse) {
		this.data = data;
	}

	@ApiProperty({ type: [CardResponse] })
	data: CardResponse[];
}
