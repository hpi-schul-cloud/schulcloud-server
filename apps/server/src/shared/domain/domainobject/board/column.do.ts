import { EntityId } from '@shared/domain/types';
import { Card } from './card.do';
import type { BoardNodeBuildable, BoardNodeBuilder } from './types';

export class Column implements ColumnProps, BoardNodeBuildable {
	id: EntityId;

	title?: string;

	children: Card[];

	createdAt: Date;

	updatedAt: Date;

	constructor(props: ColumnProps) {
		this.id = props.id;
		this.title = props.title;
		this.children = props.children;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	addCard(card: Card, position?: number) {
		this.children.splice(position || this.children.length, 0, card);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId, position?: number): void {
		builder.buildColumnNode(this, parentId, position);
	}
}

export interface ColumnProps {
	id: EntityId;

	title?: string;

	children: Card[];

	createdAt: Date;

	updatedAt: Date;
}
