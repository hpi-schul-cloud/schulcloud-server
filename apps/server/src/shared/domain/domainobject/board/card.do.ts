import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { FileElement } from './file-element.do';
import { RichTextElement } from './rich-text-element.do';
import { SubmissionContainerElement } from './task-element.do';
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
			domainObject instanceof RichTextElement ||
			domainObject instanceof SubmissionContainerElement;
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
