import { HttpException, HttpStatus } from '@nestjs/common';
import { Card, Column } from '../../domain';
import { CardSkeletonResponse, ColumnResponse, TimestampsResponse } from '../dto';

export class ColumnResponseMapper {
	static mapToResponse(column: Column): ColumnResponse {
		const result = new ColumnResponse({
			id: column.id,
			title: column.title,
			cards: column.children.map((card) => {
				/* istanbul ignore next */
				if (!(card instanceof Card)) {
					throw new HttpException(`unsupported child type: ${card.constructor.name}`, HttpStatus.UNPROCESSABLE_ENTITY);
				}
				return new CardSkeletonResponse({
					cardId: card.id,
					height: card.height,
				});
			}),
			timestamps: new TimestampsResponse({ lastUpdatedAt: column.updatedAt, createdAt: column.createdAt }),
		});
		return result;
	}
}
