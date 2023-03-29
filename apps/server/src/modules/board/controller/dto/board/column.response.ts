import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { CardSkeletonResponse } from './card-skeleton.response';
import { TimestampsResponse } from '../timestamps.response';

export class ColumnResponse {
	constructor({ id, title, cards, timestamps }: ColumnResponse) {
		this.id = id;
		this.title = title;
		this.cards = cards;
		this.timestamps = timestamps;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title?: string;

	@ApiProperty({
		type: [CardSkeletonResponse],
	})
	cards: CardSkeletonResponse[];

	@ApiProperty()
	timestamps: TimestampsResponse;
}
