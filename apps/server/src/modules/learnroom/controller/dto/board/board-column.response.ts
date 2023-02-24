import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { BoardSkeletonCardReponse } from './board-skeleton-card.response';

export class BoardColumnResponse {
	constructor({ id, title, cards }: BoardColumnResponse) {
		this.id = id;
		this.title = title;
		this.cards = cards;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty({
		type: [BoardSkeletonCardReponse],
	})
	cards: BoardSkeletonCardReponse[];
}
