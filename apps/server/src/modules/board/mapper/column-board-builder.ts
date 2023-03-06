import { AnyBoardDo, BoardNode, BoardNodeType, Column, ColumnBoard, ColumnBoardNode } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class ColumnBoardBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): ColumnBoard {
		this.ensureBoardNodeType(boardNode, BoardNodeType.COLUMN_BOARD);

		const columns = children.filter((c) => c.constructor.name === 'Column') as Column[];
		const columnBoard = new ColumnBoard({
			id: boardNode.id,
			title: (boardNode as ColumnBoardNode).title,
			columns,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return columnBoard;
	}
}
