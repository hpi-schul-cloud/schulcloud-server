import { EntityId, FileElement, isFileElement, isRichTextElement, RichTextElement } from '@shared/domain';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class SubmissionItem extends BoardComposite<SubmissionItemProps> {
	get completed(): boolean {
		return this.props.completed;
	}

	set completed(value: boolean) {
		this.props.completed = value;
	}

	get userId(): EntityId {
		return this.props.userId;
	}

	set userId(value: EntityId) {
		this.props.userId = value;
	}

	isAllowedAsChild(child: AnyBoardDo): boolean {
		const allowed = isFileElement(child) || isRichTextElement(child);

		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitSubmissionItem(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitSubmissionItemAsync(this);
	}
}

export interface SubmissionItemProps extends BoardCompositeProps {
	completed: boolean;
	userId: EntityId;
}

export function isSubmissionItem(reference: unknown): reference is SubmissionItem {
	return reference instanceof SubmissionItem;
}

export const isSubmissionItemContent = (element: AnyBoardDo): element is RichTextElement | FileElement =>
	isRichTextElement(element) || isFileElement(element);
