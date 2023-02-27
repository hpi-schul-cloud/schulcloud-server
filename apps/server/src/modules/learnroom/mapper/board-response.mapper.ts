import { ColumnBoard } from '@shared/domain';
import { BoardResponse } from '../controller/dto';

export class BoardResponseMapper {
	static mapToResponse(board: ColumnBoard): BoardResponse {
		const result = new BoardResponse({
			id: board.id,
			title: board.title,
			columns: board.columns.map((column) => {
				return {
					id: column.id,
					title: column.title,
					cards: column.cardSkeletons.map((skeleton) => {
						return { cardId: skeleton.cardId, height: skeleton.height };
					}),
				};
			}),
			timestamps: { lastUpdatedAt: board.updatedAt, createdAt: board.createdAt },
		});
		return result;
	}
}
