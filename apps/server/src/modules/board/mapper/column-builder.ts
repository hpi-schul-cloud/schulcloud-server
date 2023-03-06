import { AnyBoardDo, BoardNode, BoardNodeType, Card, Column, ColumnNode } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class ColumnBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): Column {
		this.ensureBoardNodeType(boardNode, BoardNodeType.COLUMN);

		const cards = children.filter((c) => c.constructor.name === 'Card') as Card[];

		const column = new Column({
			id: boardNode.id,
			title: (boardNode as ColumnNode).title,
			cards,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return column;
	}
}
