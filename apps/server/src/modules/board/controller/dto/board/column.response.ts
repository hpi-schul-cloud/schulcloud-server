import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { CardSkeletonResponse } from './card-skeleton.response';

export class ColumnResponse {
	constructor({ id, title, cards }: ColumnResponse) {
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
		type: [CardSkeletonResponse],
	})
	cards: CardSkeletonResponse[];
}
