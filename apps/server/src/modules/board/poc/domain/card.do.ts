import { BoardNode } from './board-node.do';
import { AnyBoardNode, CardProps, isContentElement } from './types';

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
		return isContentElement(childNode);
	}
}

export const isCard = (reference: unknown): reference is Card => reference instanceof Card;
