import { BoardNode } from './board-node.do';
import { AnyBoardNode, ColumnBoardProps } from './types';

export class ColumnBoard extends BoardNode<ColumnBoardProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	get isVisible(): boolean {
		return this.props.isVisible;
	}

	set isVisible(isVisible: boolean) {
		this.props.isVisible = isVisible;
	}

	isAllowedAsChild(boardNode: AnyBoardNode): boolean {
		// TODO: Column is not defined yet
		// 	const allowed = boardNode instanceof Column;
		// false as placeholders
		return false;
	}
}
