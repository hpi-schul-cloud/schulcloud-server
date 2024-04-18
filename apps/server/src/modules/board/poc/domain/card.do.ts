import { BoardNode } from './board-node.do';
import { AnyBoardNode, CardProps } from './types';

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

	isAllowedAsChild(boardNode: AnyBoardNode): boolean {
		// TODO: relevant types are not defined yet
		// const allowed =
		// 	boardNode instanceof TextElement, FileElement...
		// false just as placeholder
		return false;
	}
}
