import { BoardNode } from './board-node.do';
import { Card } from './card.do';
import type { BoardNodeChild } from './types/board-node-child';
import type { ColumnProps } from './types/board-node-props';

export class Column extends BoardNode<ColumnProps> {
	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}

	public canHaveChild(childNode: BoardNodeChild): boolean {
		return childNode instanceof Card;
	}
}

export const isColumn = (reference: unknown): reference is Column => reference instanceof Column;
