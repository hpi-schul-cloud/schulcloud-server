import { EntityId } from '@shared/domain/types';
import { Card } from './card.do';
import type { BoardNodeBuildable, BoardNodeBuilder } from './types';

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

	addCard(card: Card, position?: number) {
		this.cards.splice(position || this.cards.length, 0, card);
	}

	useBoardNodeBuilder(builder: BoardNodeBuilder, parentId?: EntityId): void {
		builder.buildColumnNode(this, parentId);
	}
}

export interface ColumnProps {
	id: EntityId;

	title?: string;

	cards: Card[];

	createdAt: Date;

	updatedAt: Date;
}
