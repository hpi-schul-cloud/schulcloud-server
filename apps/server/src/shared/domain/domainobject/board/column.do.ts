import type { BoardNode } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Card } from './card.do';
import type { BoardNodeBuilder } from './types';
import type { BoardNodeBuildable } from './types/board-node-buildable';

export class Column implements ColumnProps, BoardNodeBuildable {
	id: EntityId;

	title?: string;

	cards: Card[];

	createdAt: Date;

	updatedAt: Date;

	constructor(props: ColumnProps) {
		this.id = props.id;
		this.title = props.title;
		this.cards = props.cards;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder): BoardNode[] {
		const boardNodes = builder.buildColumnNode(this);
		return boardNodes;
	}
}

interface ColumnProps {
	id: EntityId;

	title?: string;

	cards: Card[];

	createdAt: Date;

	updatedAt: Date;
}
