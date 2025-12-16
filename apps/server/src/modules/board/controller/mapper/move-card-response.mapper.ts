import { Card, Column, ColumnBoard } from '../../domain';
import { CardSkeletonResponse } from '../dto';
import { MoveCardResponse } from '../dto/board/move-card.response';
import { ShortNodeResponse } from '../dto/board/short-node.response';

export class MoveCardResponseMapper {
	public static mapToReponse(data: {
		card: Card;
		fromBoard: ColumnBoard;
		toBoard: ColumnBoard;
		fromColumn: Column;
		toColumn: Column;
	}): MoveCardResponse {
		return new MoveCardResponse({
			fromBoard: new ShortNodeResponse({
				id: data.fromBoard.id,
				title: data.fromBoard.title,
			}),
			toBoard: new ShortNodeResponse({
				id: data.toBoard.id,
				title: data.toBoard.title,
			}),
			fromColumn: new ShortNodeResponse({
				id: data.fromColumn.id,
				title: data.fromColumn.title,
			}),
			toColumn: new ShortNodeResponse({
				id: data.toColumn.id,
				title: data.toColumn.title,
			}),
			card: new CardSkeletonResponse({
				cardId: data.card.id,
				height: data.card.height,
			}),
		});
	}
}
