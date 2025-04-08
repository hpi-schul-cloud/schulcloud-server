import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';

export class CardSkeletonResponse {
	constructor({ cardId, height }: CardSkeletonResponse) {
		this.cardId = cardId;
		this.height = height;
	}

	@ApiProperty({
		pattern: bsonStringPattern,
	})
	cardId: string;

	@ApiProperty({
		description:
			'The approximate height of the referenced card. Intended to be used for prerendering purposes. Note, that different devices can lead to this value not being precise',
	})
	height: number;
}
