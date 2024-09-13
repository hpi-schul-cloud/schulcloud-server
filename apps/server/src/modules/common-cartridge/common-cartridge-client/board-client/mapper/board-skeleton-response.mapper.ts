import { BoardResponse, ColumnResponse, CardSkeletonResponse } from '../board-api-client';
import { BoardSkeletonDto, ColumnSkeletonDto, CardSkeletonDto } from '../dto';

export class BoardSkeletonDtoMapper {
	public static mapToBoardSkeletonDto(boardResponse: BoardResponse): BoardSkeletonDto {
		return new BoardSkeletonDto({
			boardId: boardResponse.id,
			title: boardResponse.title,
			columns: boardResponse.columns.map((column) => this.mapToColumnSkeletonDto(column)),
			isVisible: boardResponse.isVisible,
			layout: boardResponse.layout,
		});
	}

	private static mapToColumnSkeletonDto(columnResponse: ColumnResponse): ColumnSkeletonDto {
		return new ColumnSkeletonDto({
			columnId: columnResponse.id,
			title: columnResponse.title,
			cards: columnResponse.cards.map((card) => this.mapToCardSkeletonDto(card)),
		});
	}

	private static mapToCardSkeletonDto(cardResponse: CardSkeletonResponse): CardSkeletonDto {
		return new CardSkeletonDto({
			cardId: cardResponse.cardId,
			height: cardResponse.height,
		});
	}
}
