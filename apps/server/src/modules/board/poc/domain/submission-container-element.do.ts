import { BoardNode } from './board-node.do';
import type { AnyBoardNode, SubmissionContainerElementProps } from './types';
import { SubmissionItem } from './submission-item.do';

export class SubmissionContainerElement extends BoardNode<SubmissionContainerElementProps> {
	get dueDate(): Date | undefined {
		return this.props.dueDate ?? undefined;
	}

	set dueDate(value: Date | undefined) {
		this.props.dueDate = value ?? undefined;
	}

	canHaveChild(childNode: AnyBoardNode): boolean {
		return childNode instanceof SubmissionItem;
	}
}
