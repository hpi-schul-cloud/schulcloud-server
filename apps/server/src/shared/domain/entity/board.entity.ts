import { Entity, Collection, ManyToMany, ManyToOne } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { BoardElement } from './boardelement.entity';
import type { Course } from './course.entity';

export type BoardProps = {
	references: BoardElement[];
	room: Course;
};

@Entity({ tableName: 'board' })
export class Board extends BaseEntityWithTimestamps {
	constructor(props: BoardProps) {
		super();
		this.room = props.room;
		this.references.set(props.references);
	}

	@ManyToOne('Course')
	room: Course;

	@ManyToMany('BoardElement', undefined, { fieldName: 'referenceIds' })
	references = new Collection<BoardElement>(this);
}
