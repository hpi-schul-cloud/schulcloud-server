import { Entity, ManyToOne } from '@mikro-orm/core';
import { LegacyBoardElement, LegacyBoardElementType } from '@modules/learnroom/repo';
import { LessonEntity } from '../lesson.entity';

@Entity({ discriminatorValue: LegacyBoardElementType.Lesson })
export class LessonBoardElement extends LegacyBoardElement {
	constructor(props: { target: LessonEntity }) {
		super(props);
		this.boardElementType = LegacyBoardElementType.Lesson;
	}

	@ManyToOne('LessonEntity')
	target!: LessonEntity;
}
