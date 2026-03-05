import { HttpException, HttpStatus } from '@nestjs/common';
import { BoardOperation } from '../../authorisation/board-node.rule';
import { BoardFeature, Column, ColumnBoard } from '../../domain';
import { BoardResponse, TimestampsResponse } from '../dto';
import { ColumnResponseMapper } from './column-response.mapper';

export class BoardResponseMapper {
	public static mapToResponse(
		board: ColumnBoard,
		features: BoardFeature[],
		allowedOperations: Record<BoardOperation, boolean>
	): BoardResponse {
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
			readersCanEdit: board.readersCanEdit,
			layout: board.layout,
			features,
			allowedOperations,
		});
		return result;
	}
}
