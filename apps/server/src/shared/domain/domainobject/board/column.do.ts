import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { Card } from './card.do';
import { AnyBoardDo } from './types/any-board-do';
import { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types/board-composite-visitor';

export class Column extends BoardComposite<ColumnProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

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

export interface ColumnProps extends BoardCompositeProps {
	title: string;
}

export function isColumn(reference: unknown): reference is Column {
	return reference instanceof Column;
}
