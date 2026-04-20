import { BoardNode } from './board-node.do';
import { AnyBoardNode, CardProps, isContentElement } from './types';
import { Colors } from './types/colors.enum';

export class Card extends BoardNode<CardProps> {
	get title(): string | undefined {
		return this.props.title;
	}

	set title(title: string | undefined) {
		this.props.title = title;
	}

	get backgroundColor(): Colors {
		return this.props.backgroundColor || Colors.TRANSPARENT;
	}

	set backgroundColor(color: Colors) {
		this.props.backgroundColor = color;
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
