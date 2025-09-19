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
		if (!isVisible) {
			this.props.readersCanEdit = false;
		}
		this.props.isVisible = isVisible;
	}

	get layout(): BoardLayout {
		return this.props.layout;
	}

	set layout(layout: BoardLayout) {
		this.props.layout = layout;
	}

	get readersCanEdit(): boolean {
		return this.props.readersCanEdit;
	}

	set readersCanEdit(readersCanEdit: boolean) {
		this.props.readersCanEdit = readersCanEdit;
	}

	canHaveChild(childNode: AnyBoardNode): boolean {
		const allowed = childNode instanceof Column;
		return allowed;
	}
}

export const isColumnBoard = (reference: unknown): reference is ColumnBoard => reference instanceof ColumnBoard;
