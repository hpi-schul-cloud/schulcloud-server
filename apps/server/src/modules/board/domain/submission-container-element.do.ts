import { BoardNode } from './board-node.do';
import type { AnyBoardNode, SubmissionContainerElementProps } from './types';
import { SubmissionItem } from './submission-item.do';

export class SubmissionContainerElement extends BoardNode<SubmissionContainerElementProps> {
	get dueDate(): Date | undefined {
		return this.props.dueDate ?? undefined;
	}

	set dueDate(value: Date | undefined) {
		// TODO check if should be null instead of undefined
		this.props.dueDate = value ?? undefined;
	}

	canHaveChild(childNode: AnyBoardNode): boolean {
		return childNode instanceof SubmissionItem;
	}
}

export const isSubmissionContainerElement = (reference: unknown): reference is SubmissionContainerElement =>
	reference instanceof SubmissionContainerElement;
