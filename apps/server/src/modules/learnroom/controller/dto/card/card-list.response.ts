import { ApiProperty } from '@nestjs/swagger';
import { CardResponse } from './card.response';

export class CardListResponse {
	constructor(data: CardResponse[]) {
		this.data = data;
	}

	@ApiProperty({ type: [CardResponse] })
	data: CardResponse[];
}
