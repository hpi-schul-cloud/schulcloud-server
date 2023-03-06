import { EntityId } from '@shared/domain/types';
import { Card } from './card.do';

export class Column implements ColumnProps {
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
}

interface ColumnProps {
	id: EntityId;

	title?: string;

	cards: Card[];

	createdAt: Date;

	updatedAt: Date;
}
