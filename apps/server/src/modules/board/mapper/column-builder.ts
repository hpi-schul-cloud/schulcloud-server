import { BoardNode, BoardNodeType, Card, Column } from '@shared/domain';
import { AnyBoardDo } from '../types/any-board-do';

export class ColumnBuilder {
	public static build(boardNode: BoardNode, children: AnyBoardDo[] = []): Column | undefined {
		if (boardNode.type !== BoardNodeType.COLUMN) return undefined;

		const cards = children.filter((c) => c.constructor.name === 'Card') as Card[];

		const column = new Column({
			id: boardNode.id,
			title: '',
			cards,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return column;
	}
}
