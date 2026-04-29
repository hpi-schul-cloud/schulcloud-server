import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { DecodeHtmlEntities } from '@shared/controller/transformer';
import { TimestampsResponse } from '../timestamps.response';
import { CardResponse } from '../card';

export class ColumnFullResponse {
	constructor({ id, title, cards, timestamps }: ColumnFullResponse) {
		this.id = id;
		this.title = title;
		this.cards = cards;
		this.timestamps = timestamps;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty({
		type: [CardResponse],
	})
	cards: CardResponse[];

	@ApiProperty()
	timestamps: TimestampsResponse;
}
