import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { Card } from './card.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class Column extends BoardComposite<BoardCompositeProps> {
	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof Card;
		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitColumn(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitColumnAsync(this);
	}
}
