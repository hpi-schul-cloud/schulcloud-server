import { HttpException, HttpStatus } from '@nestjs/common';
import { BoardFeature, Column, ColumnBoard } from '../../domain';
import { BoardResponse, TimestampsResponse } from '../dto';
import { ColumnResponseMapper } from './column-response.mapper';

export class BoardResponseMapper {
	static mapToResponse(board: ColumnBoard, features: BoardFeature[]): BoardResponse {
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
			isVisible: board.isVisible,
			layout: board.layout,
			features,
		});
		return result;
	}
}
