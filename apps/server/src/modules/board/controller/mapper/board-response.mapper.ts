import { ColumnBoard } from '@shared/domain';
import { BoardResponse, CardSkeletonResponse } from '../dto';
import { ColumnResponse } from '../dto/board/column.response';

export class BoardResponseMapper {
	static mapToResponse(board: ColumnBoard): BoardResponse {
		const result = new BoardResponse({
			id: board.id,
			title: board.title,
			columns: board.columns.map(
				(column) =>
					new ColumnResponse({
						id: column.id,
						title: column.title,
						cards: column.cards.map((card) => new CardSkeletonResponse({ cardId: card.id, height: card.height })),
					})
			),
			timestamps: { lastUpdatedAt: board.updatedAt, createdAt: board.createdAt },
		});
		return result;
	}
}
