import { BoardNode, BoardNodeType, Column, ColumnBoard } from '@shared/domain';
import { AnyBoardDo } from '../types/any-board-do';
import { BoardDoBuilder } from './board-do-builder';

export class ColumnBoardBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): ColumnBoard {
		this.ensureBoardNodeType(boardNode, BoardNodeType.BOARD);

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
