import { BoardNode, BoardNodeType, Column, ColumnBoard } from '@shared/domain';
import { AnyBoardDo } from '../types/any-board-do';

export class ColumnBoardBuilder {
	public static build(boardNode: BoardNode, children: AnyBoardDo[] = []): ColumnBoard | undefined {
		if (boardNode.type !== BoardNodeType.BOARD) return undefined;

		const columns = children.filter((c) => c.constructor.name === 'Column') as Column[];

		const columnBoard = new ColumnBoard({
			id: boardNode.id,
			title: '',
			columns,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return columnBoard;
	}
}
