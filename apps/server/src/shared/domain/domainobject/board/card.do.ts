import type { EntityId } from '../../types';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { TextElement } from './text-element.do';
import type { AnyBoardDo } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class Card extends BoardComposite implements CardProps, BoardNodeBuildable {
	height: number;

	constructor(props: CardProps) {
		super(props);
		this.title = props.title;
		this.height = props.height;
	}

	addChild(child: AnyBoardDo, toIndex?: number) {
		if (child instanceof TextElement) {
			this._addChild(child, toIndex);
		} else {
			throw new Error(`Cannot add child of type '${child.constructor.name}'`);
		}
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildCardNode(this, parentId, position);
	}
}

export interface CardProps extends BoardCompositeProps {
	height: number;
}
