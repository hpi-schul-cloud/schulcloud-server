import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity, BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { CourseInfo } from './course-info.entity';
import { NewsTarget, NewsTargetModel, NewsTargetModelValue } from './news.types';
import { SchoolInfo } from './school-info.entity';
import { TeamInfo } from './team-info.entity';
import { UserInfo } from './user-info.entity';

interface INewsProperties {
	title: string;
	content: string;
	displayAt: Date;
	school: EntityId;
	creator: EntityId;

	externalId?: string;
	source?: 'internal' | 'rss';
	sourceDescription?: string;
	updater?: EntityId;
}

@Entity({
	discriminatorColumn: 'targetModel',
	abstract: true,
})
export class News extends BaseEntityWithTimestamps {
	/** the news title */
	@Property()
	title!: string;

	/** the news content as html */
	@Property()
	content!: string;

	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	@Property()
	displayAt!: Date;

	@Property()
	externalId?: string;

	@Property()
	source?: 'internal' | 'rss';

	@Property()
	sourceDescription?: string;

	/** id reference to a collection */
	@ManyToOne()
	target: BaseEntity;

	/** name of a collection which is referenced in target */
	@Enum()
	targetModel: NewsTargetModelValue;

	@ManyToOne({ fieldName: 'schoolId' })
	school: SchoolInfo;

	@ManyToOne({ fieldName: 'creatorId' })
	creator: UserInfo;

	@ManyToOne({ fieldName: 'updaterId' })
	updater?: UserInfo;

	permissions: string[] = [];

	setTarget(target: NewsTarget): void {
		Object.assign(this, { targetModel: target.targetModel, target: target.targetId });
	}

	constructor(props: INewsProperties, target?: NewsTarget) {
		super();
		this.title = props.title;
		this.content = props.content;
		this.displayAt = props.displayAt;
		Object.assign(this, { school: props.school, creator: props.creator });
		if (target != null) {
			this.setTarget(target);
		}
	}
}

@Entity({ discriminatorValue: NewsTargetModel.School })
export class SchoolNews extends News {
	@ManyToOne()
	target: SchoolInfo;

	@Property()
	targetModel: typeof NewsTargetModel.School;

	constructor(props: INewsProperties) {
		super(props, undefined);
	}
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	@ManyToOne()
	target: CourseInfo;

	@Property()
	targetModel: typeof NewsTargetModel.Course;

	constructor(props: INewsProperties) {
		super(props, undefined);
	}
}

@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	@ManyToOne()
	target: TeamInfo;

	@Property()
	targetModel: typeof NewsTargetModel.Team;

	constructor(props: INewsProperties) {
		super(props, undefined);
	}
}
