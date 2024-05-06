import { EntityId } from '@shared/domain/types';
import { BoardNode } from './board-node.do';
import { FileElement, isFileElement } from './file-element.do';
import { isRichTextElement, RichTextElement } from './rich-text-element.do';
import type { AnyBoardNode, SubmissionItemProps } from './types';

export class SubmissionItem extends BoardNode<SubmissionItemProps> {
	get completed(): boolean {
		return this.props.completed ?? false;
	}

	set completed(value: boolean) {
		this.props.completed = value;
	}

	get userId(): EntityId {
		return this.props.userId ?? '';
	}

	set userId(value: EntityId) {
		this.props.userId = value;
	}

	canHaveChild(childNode: AnyBoardNode): boolean {
		return isRichTextElement(childNode) || isFileElement(childNode);
	}
}

export const isSubmissionItem = (reference: unknown): reference is SubmissionItem =>
	reference instanceof SubmissionItem;

export const isSubmissionItemContent = (element: AnyBoardNode): element is RichTextElement | FileElement =>
	isRichTextElement(element) || isFileElement(element);
