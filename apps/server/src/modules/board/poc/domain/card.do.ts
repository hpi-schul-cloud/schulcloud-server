import { BoardNode } from './board-node.do';
import type { AnyBoardNode, CardProps } from './types';
import { CollaborativeTextEditor } from './collaborative-text-editor.do';
import { DrawingElement } from './drawing-element.do';
import { ExternalToolElement } from './external-tool-element.do';
import { FileElement } from './file-element.do';
import { LinkElement } from './link-element.do';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';

export class Card extends BoardNode<CardProps> {
	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}

	get height(): number {
		return this.props.height;
	}

	set height(height: number) {
		this.props.height = height;
	}

	canHaveChild(childNode: AnyBoardNode): boolean {
		return (
			childNode instanceof CollaborativeTextEditor ||
			childNode instanceof DrawingElement ||
			childNode instanceof ExternalToolElement ||
			childNode instanceof FileElement ||
			childNode instanceof LinkElement ||
			childNode instanceof RichTextElement ||
			childNode instanceof SubmissionContainerElement
		);
	}
}
