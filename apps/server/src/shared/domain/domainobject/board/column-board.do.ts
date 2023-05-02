import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { Column } from './column.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class ColumnBoard extends BoardComposite<BoardCompositeProps> {
	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof Column;
		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitColumnBoard(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitColumnBoardAsync(this);
	}
}
