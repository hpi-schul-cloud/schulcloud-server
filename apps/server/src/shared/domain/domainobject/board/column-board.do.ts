import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { Column } from './column.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardExternalReference } from './types';
import { BoardLayout } from './types/board-layout.enum';

export class ColumnBoard extends BoardComposite<ColumnBoardProps> {
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

export interface ColumnBoardProps extends BoardCompositeProps {
	title: string;
	context: BoardExternalReference;
	isVisible: boolean;
	layout: BoardLayout;
}

export function isColumnBoard(reference: unknown): reference is ColumnBoard {
	return reference instanceof ColumnBoard;
}
