import { HttpException, HttpStatus } from '@nestjs/common';
import { Card } from '@shared/domain/domainobject/board/card.do';
import { Column } from '@shared/domain/domainobject/board/column.do';
import { CardSkeletonResponse } from '../dto/board/card-skeleton.response';
import { ColumnResponse } from '../dto/board/column.response';
import { TimestampsResponse } from '../dto/timestamps.response';

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
