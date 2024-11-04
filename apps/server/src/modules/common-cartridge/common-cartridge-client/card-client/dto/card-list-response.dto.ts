import { CardResponseDto } from './card-response.dto';

export class CardListResponseDto {
	data: CardResponseDto[];

	constructor(data: CardResponseDto[]) {
		this.data = data;
	}
}
