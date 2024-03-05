import { Entity, ManyToOne } from '@mikro-orm/core';
import { LessonEntity } from '../lesson.entity';
import { LegacyBoardElement, LegacyBoardElementType } from './legacy-boardelement.entity';

@Entity({ discriminatorValue: LegacyBoardElementType.Lesson })
export class LessonBoardElement extends LegacyBoardElement {
	constructor(props: { target: LessonEntity }) {
		super(props);
		this.boardElementType = LegacyBoardElementType.Lesson;
	}

	@ManyToOne('LessonEntity')
	target!: LessonEntity;
}
