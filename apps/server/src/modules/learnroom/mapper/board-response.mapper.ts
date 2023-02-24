import { ColumnBoard } from '@shared/domain';
import { BoardResponse, TimestampsResponse } from '../controller/dto';
import { BoardColumnResponse } from '../controller/dto/board/board-column.response';
import { BoardSkeletonCardReponse } from '../controller/dto/board/board-skeleton-card.response';

export class BoardResponseMapper {
	static mapToResponse(board: ColumnBoard): BoardResponse {
		const result = new BoardResponse({
			id: 'abcdefg',
			title: 'a mocked testboard, please do not use',
			columns: [
				new BoardColumnResponse({
					id: '10',
					title: 'first column',
					cards: [
						new BoardSkeletonCardReponse({ cardId: '1', height: 36 }),
						new BoardSkeletonCardReponse({ cardId: '2', height: 42 }),
					],
				}),
				new BoardColumnResponse({
					id: '20',
					title:
						'second column, has a relatively long title that may or may not be a bit challenging to render... maybe do it partially?',
					cards: [new BoardSkeletonCardReponse({ cardId: '3', height: 108 })],
				}),
				new BoardColumnResponse({
					id: '30',
					title: 'third column is empty for now',
					cards: [],
				}),
			],
			timestamps: new TimestampsResponse({ lastUpdatedAt: new Date().toString(), createdAt: new Date().toString() }),
		});
		return result;
	}
}
