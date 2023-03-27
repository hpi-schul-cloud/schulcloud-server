import { Card, Column } from '@shared/domain';
import { CardSkeletonResponse, ColumnResponse, TimestampsResponse } from '../dto';

export class ColumnResponseMapper {
	static mapToResponse(column: Column): ColumnResponse {
		const result = new ColumnResponse({
			id: column.id,
			title: column.title,
			cards: column.children.map((card) => {
				if (!(card instanceof Card)) {
					/* istanbul ignore next */
					throw new Error(`unsupported child type: ${card.constructor.name}`);
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
