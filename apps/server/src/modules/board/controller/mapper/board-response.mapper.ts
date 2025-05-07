import { HttpException, HttpStatus } from '@nestjs/common';
import { BoardFeature, Column, ColumnBoard } from '../../domain';
import { BoardResponse, TimestampsResponse } from '../dto';
import { ColumnResponseMapper } from './column-response.mapper';
import { Permission } from '@shared/domain/interface/permission.enum';

export class BoardResponseMapper {
	public static mapToResponse(board: ColumnBoard, features: BoardFeature[], permissions: Permission[]): BoardResponse {
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
			permissions,
		});
		return result;
	}
}
