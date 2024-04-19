import { BoardNode } from './board-node.do';
import { ColumnProps } from './types';

export class Column extends BoardNode<ColumnProps> {
	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}
}
