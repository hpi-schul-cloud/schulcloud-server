import { ColumnBoard } from '@shared/domain';
import { BoardResponse, TimestampsResponse } from '../dto';
import { ColumnResponseMapper } from './column-response.mapper';

export class BoardResponseMapper {
	static mapToResponse(board: ColumnBoard): BoardResponse {
		const result = new BoardResponse({
			id: board.id,
			title: board.title,
			columns: board.children.map((column) => ColumnResponseMapper.mapToResponse(column)),
			timestamps: new TimestampsResponse({ lastUpdatedAt: board.updatedAt, createdAt: board.createdAt }),
		});
		return result;
	}
}
