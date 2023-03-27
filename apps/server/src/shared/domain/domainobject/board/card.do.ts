import type { EntityId } from '../../types';
import { BoardComposite } from './board-composite.do';
import { TextElement } from './text-element.do';
import type { AnyBoardDo } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class Card extends BoardComposite implements CardProps, BoardNodeBuildable {
	height: number;

	constructor(props: CardProps) {
		super(props);
		this.height = props.height;
	}

	addElement(element: TextElement, toIndex?: number) {
		this.addChild(element, toIndex);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildCardNode(this, parentId, position);
	}
}

export interface CardProps {
	id: EntityId;

	title?: string;

	height: number;

	children: AnyBoardDo[];

	createdAt: Date;

	updatedAt: Date;
}
