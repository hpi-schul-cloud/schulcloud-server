import type { EntityId } from '../../types';
import { TextElement } from './text-element.do';
import type { BoardNodeBuildable } from './types/board-node-buildable';
import type { BoardNodeBuilder } from './types/board-node-builder';

export class Card implements CardProps, BoardNodeBuildable {
	id: EntityId;

	title: string;

	height: number;

	children: TextElement[]; // TODO: AnyContentElement

	createdAt: Date;

	updatedAt: Date;

	constructor(props: CardProps) {
		this.id = props.id;
		this.title = props.title;
		this.height = props.height;
		this.children = props.children;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	addElement(element: TextElement, position?: number) {
		this.children.splice(position || this.children.length, 0, element);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildCardNode(this, parentId, position);
	}
}

export interface CardProps {
	id: EntityId;

	title: string;

	height: number;

	children: TextElement[]; // TODO: AnyContentElement

	createdAt: Date;

	updatedAt: Date;
}
