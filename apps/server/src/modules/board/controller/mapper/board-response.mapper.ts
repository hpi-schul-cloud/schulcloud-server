import { ColumnBoard } from '@shared/domain';
import { BoardResponse, CardSkeletonResponse, ColumnResponse, TimestampsResponse } from '../dto';

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
			timestamps: new TimestampsResponse({ lastUpdatedAt: board.updatedAt, createdAt: board.createdAt }),
		});
		return result;
	}
}
