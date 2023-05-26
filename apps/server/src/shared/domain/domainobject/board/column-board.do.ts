import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { Column } from './column.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardExternalReference } from './types';

export class ColumnBoard extends BoardComposite<ColumnBoardProps> {
	hidden = false; // WIP : BC-3573 :  implement in entity-object

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

	publish() {
		this.hidden = false;
	}

	unpublish() {
		this.hidden = true;
	}
}

export interface ColumnBoardProps extends BoardCompositeProps {
	title: string;
	context: BoardExternalReference;
}
