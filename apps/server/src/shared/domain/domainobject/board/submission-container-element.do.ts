import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { SubmissionItem } from './submission-item.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class SubmissionContainerElement extends BoardComposite<SubmissionContainerElementProps> {
	get dueDate(): Date | null {
		return this.props.dueDate;
	}

	set dueDate(value: Date | null) {
		this.props.dueDate = value;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof SubmissionItem;
		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitSubmissionContainerElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitSubmissionContainerElementAsync(this);
	}
}

export interface SubmissionContainerElementProps extends BoardCompositeProps {
	dueDate: Date | null;
}

export function isSubmissionContainerElement(reference: unknown): reference is SubmissionContainerElement {
	return reference instanceof SubmissionContainerElement;
}
