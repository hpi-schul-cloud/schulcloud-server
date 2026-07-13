import { ApiProperty } from '@nestjs/swagger';
import { CardSkeletonResponse } from './card-skeleton.response';
import { ShortNodeResponse } from './short-node.response';

export class MoveCardResponse {
	constructor({ fromBoard, toBoard, fromColumn, toColumn, card }: MoveCardResponse) {
		this.fromBoard = fromBoard;
		this.toBoard = toBoard;
		this.fromColumn = fromColumn;
		this.toColumn = toColumn;
		this.card = card;
	}

	@ApiProperty({ type: ShortNodeResponse })
	fromBoard: ShortNodeResponse;

	@ApiProperty({ type: ShortNodeResponse })
	toBoard: ShortNodeResponse;

	@ApiProperty({ type: ShortNodeResponse })
	fromColumn: ShortNodeResponse;

	@ApiProperty({ type: ShortNodeResponse })
	toColumn: ShortNodeResponse;

	@ApiProperty({ type: CardSkeletonResponse })
	card: CardSkeletonResponse;
}
