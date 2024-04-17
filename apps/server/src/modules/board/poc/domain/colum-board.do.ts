import { BoardNode } from './board-node.do';
import { ColumnBoardProps } from './types';

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
}
