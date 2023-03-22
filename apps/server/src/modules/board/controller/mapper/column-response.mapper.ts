import { Column } from '@shared/domain';
import { CardSkeletonResponse, ColumnResponse, TimestampsResponse } from '../dto';

export class ColumnResponseMapper {
	static mapToResponse(column: Column): ColumnResponse {
		const result = new ColumnResponse({
			id: column.id,
			title: column.title,
			cards: column.children.map(
				(card) =>
					new CardSkeletonResponse({
						cardId: card.id,
						height: card.height,
					})
			),
			timestamps: new TimestampsResponse({ lastUpdatedAt: column.updatedAt, createdAt: column.createdAt }),
		});
		return result;
	}
}
