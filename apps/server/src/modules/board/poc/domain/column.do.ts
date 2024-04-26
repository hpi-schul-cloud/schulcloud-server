import { BoardNode } from './board-node.do';
import { Card } from './card.do';
import type { AnyBoardNode, ColumnProps } from './types';

export class Column extends BoardNode<ColumnProps> {
	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}

	canChildBeAdded(childNode: AnyBoardNode): boolean {
		const allowed = childNode instanceof Card;
		return allowed;
	}
}
