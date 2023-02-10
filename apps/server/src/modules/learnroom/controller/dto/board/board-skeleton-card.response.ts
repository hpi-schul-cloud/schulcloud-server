import { ApiProperty } from '@nestjs/swagger';

export class BoardSkeletonCardReposinse {
	constructor({ cardId, height }: BoardSkeletonCardReposinse) {
		this.cardId = cardId;
		this.height = height;
	}

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
	})
	cardId: string;

	@ApiProperty({
		description:
			'The approximate height of the referenced card. Intended to be used for prerendering purposes. Note, that different devices can lead to this value not being precise',
	})
	height: number;
}
