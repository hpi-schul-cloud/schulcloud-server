import { Entity, Collection, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { BoardElement } from './boardelement.entity';

export type BoardProps = {
	references: BoardElement[];
};

@Entity({ tableName: 'board' })
export class Board extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.references.set(props.references);
	}

	@ManyToMany('BoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<BoardElement>(this);
}
