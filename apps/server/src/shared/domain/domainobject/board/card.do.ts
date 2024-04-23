import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { CollaborativeTextEditorElement } from './collaborative-text-editor-element.do';
import { ExternalToolElement } from './external-tool-element.do';
import { FileElement } from './file-element.do';
import { LinkElement } from './link-element.do';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './submission-container-element.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class Card extends BoardComposite<CardProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	get height(): number {
		return this.props.height;
	}

	set height(height: number) {
		this.props.height = height;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed =
			domainObject instanceof FileElement ||
			domainObject instanceof DrawingElement ||
			domainObject instanceof LinkElement ||
			domainObject instanceof RichTextElement ||
			domainObject instanceof SubmissionContainerElement ||
			domainObject instanceof ExternalToolElement ||
			domainObject instanceof CollaborativeTextEditorElement;
		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitCard(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitCardAsync(this);
	}
}

export interface CardProps extends BoardCompositeProps {
	title: string;
	height: number;
}

export type CardInitProps = Omit<CardProps, keyof BoardCompositeProps>;

export function isCard(reference: unknown): reference is Card {
	return reference instanceof Card;
}
