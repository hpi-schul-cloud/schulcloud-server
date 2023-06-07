import { Entity, ManyToOne } from '@mikro-orm/core';
import { Lesson } from '../lesson.entity';
import { BoardElement, BoardElementType } from './boardelement.entity';

@Entity({ discriminatorValue: BoardElementType.Lesson })
export class LessonBoardElement extends BoardElement {
	constructor(props: { target: Lesson }) {
		super(props);
		this.boardElementType = BoardElementType.Lesson;
	}

	@ManyToOne('Lesson')
	target!: Lesson;
}
