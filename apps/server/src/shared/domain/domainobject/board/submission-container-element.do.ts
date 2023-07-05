import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

// todo: to be renamed
export class SubmissionContainerElement extends BoardComposite<SubmissionContainerElementProps> {
	get dueDate(): Date {
		return this.props.dueDate;
	}

	set dueDate(value: Date) {
		this.props.dueDate = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitSubmissionContainerElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitSubmissionContainerElementAsync(this);
	}
}

export interface SubmissionContainerElementProps extends BoardCompositeProps {
	dueDate: Date;
}
