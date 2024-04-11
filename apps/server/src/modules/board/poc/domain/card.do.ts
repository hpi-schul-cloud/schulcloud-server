import { BoardNode } from './board-node.do';
import { CardProps } from './types';

export class Card extends BoardNode<CardProps> {
	get height(): number {
		return this.props.height;
	}

	set height(height: number) {
		this.props.height = height;
	}
}
