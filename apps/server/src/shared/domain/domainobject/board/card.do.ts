import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { TextElement } from './text-element.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class Card extends BoardComposite<CardProps> {
	get height(): number {
		return this.props.height;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof TextElement;
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
	height: number;
}
