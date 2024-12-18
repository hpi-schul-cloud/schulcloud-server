import { CardResponseDto } from './card-response.dto';

export class CardListResponseDto {
	public data: CardResponseDto[];

	constructor(data: CardResponseDto[]) {
		this.data = data;
	}
}
