import { HttpException, HttpStatus } from '@nestjs/common';
import { ColumnBoard } from '@shared/domain/domainobject/board/column-board.do';
import { Column } from '@shared/domain/domainobject/board/column.do';
import { BoardResponse } from '../dto/board/board.response';
import { TimestampsResponse } from '../dto/timestamps.response';
import { ColumnResponseMapper } from './column-response.mapper';

export class BoardResponseMapper {
	static mapToResponse(board: ColumnBoard): BoardResponse {
		const result = new BoardResponse({
			id: board.id,
			title: board.title,
			columns: board.children.map((column) => {
				/* istanbul ignore next */
				if (!(column instanceof Column)) {
					throw new HttpException(
						`unsupported child type: ${column.constructor.name}`,
						HttpStatus.UNPROCESSABLE_ENTITY
					);
				}
				return ColumnResponseMapper.mapToResponse(column);
			}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: board.updatedAt, createdAt: board.createdAt }),
		});
		return result;
	}
}
