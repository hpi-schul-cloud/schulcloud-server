import { BoardNode } from './board-node.do';
import { Column } from './column.do';
import type { AnyBoardNode, BoardExternalReference, BoardLayout, ColumnBoardProps } from './types';

export class ColumnBoard extends BoardNode<ColumnBoardProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	get context(): BoardExternalReference {
		return this.props.context;
	}

	set context(context: BoardExternalReference) {
		this.props.context = context;
	}

	get isVisible(): boolean {
		return this.props.isVisible;
	}

	set isVisible(isVisible: boolean) {
		this.props.isVisible = isVisible;
	}

	get layout(): BoardLayout {
		return this.props.layout;
	}

	canHaveChild(childNode: AnyBoardNode): boolean {
		const allowed = childNode instanceof Column;
		return allowed;
	}
}
