import { Embeddable, Embedded, Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import { Lesson } from './lesson.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

export enum ContentElementType {
	LEGACY_TASK = 'legacy-task',
	LEGACY_LESSON = 'legacy-lesson',
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
export class ContentElement extends BaseEntityWithTimestamps {
	constructor() {
		super();
		this._id = new ObjectId();
	}

	@Enum(() => ContentElementType)
	type!: ContentElementType;
}

@Embeddable({ discriminatorValue: ContentElementType.LEGACY_LESSON })
export class LegacyLessonContentElement extends ContentElement {
	constructor(props: { lesson: Lesson }) {
		super();
		this._id = new ObjectId();
		this.type = ContentElementType.LEGACY_LESSON;
		this.lesson = props.lesson;
	}

	@ManyToOne('Lesson', { nullable: true, eager: true })
	lesson!: Lesson;
}

@Embeddable({ discriminatorValue: ContentElementType.LEGACY_TASK })
export class LegacyTaskContentElement extends ContentElement {
	constructor(props: { task: Task }) {
		super();
		this._id = new ObjectId();
		this.type = ContentElementType.LEGACY_TASK;

		this.task = props.task;
	}

	@ManyToOne('Task', { nullable: true, eager: true })
	task!: Task;
}

export interface MetaCardProps {
	publishedAt: Date;
	creator: User;
	elements: ContentElement[];
}

export enum BoardCardType {
	TASK = 'task',
	CONTENT = 'content',
	LEGACY_TASK = 'legacy-task',
	LEGACY_LESSON = 'legacy-lesson',
}

@Entity({
	tableName: 'cards',
	abstract: true,
	discriminatorColumn: 'cardType',
})
export class MetaCard extends BaseEntityWithTimestamps {
	constructor(props: MetaCardProps) {
		super();
		this.publishedAt = props.publishedAt;
		Object.assign(this, { creator: props.creator });
		this.elements = props.elements;
	}

	@Enum()
	cardType!: BoardCardType;

	@Embedded(() => ContentElement, { array: true })
	elements: ContentElement[] = [];

	@Index()
	@ManyToOne('User', { fieldName: 'userId' })
	creator!: User;

	@Property({ nullable: true })
	publishedAt?: Date;
}

@Entity({ discriminatorValue: BoardCardType.LEGACY_TASK })
export class LegacyTaskReferenceCard extends MetaCard {
	constructor(props: MetaCardProps) {
		super(props);
		this.cardType = BoardCardType.LEGACY_TASK;
	}
}

@Entity({ discriminatorValue: BoardCardType.LEGACY_LESSON })
export class LegacyLessonReferenceCard extends MetaCard {
	constructor(props: MetaCardProps) {
		super(props);
		this.cardType = BoardCardType.LEGACY_LESSON;
	}
}
