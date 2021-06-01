import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity, BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { CourseInfo } from './course-info.entity';
import { NewsTarget, NewsTargetModel, NewsTargetModelValue } from './news.types';
import { SchoolInfo } from './school-info.entity';
import { UserInfo } from './user-info.entity';

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
	target?: BaseEntity;
	/** name of a collection which is referenced in target */

	@Enum()
	targetModel: NewsTargetModelValue | undefined;

	@ManyToOne({ fieldName: 'schoolId' })
	school: SchoolInfo;

	@ManyToOne({ fieldName: 'creatorId' })
	creator: UserInfo;

	@ManyToOne({ fieldName: 'updaterId' })
	updater?: UserInfo;

	permissions: string[] = [];

	setTarget(target: NewsTarget): void {
		if (target.targetModel !== 'school') {
			Object.assign(this, { targetModel: target.targetModel, target: target.targetId });
		}
	}

	constructor(
		props: { title: string; content: string; displayAt: Date; school: EntityId; creator: EntityId },
		target?: NewsTarget
	) {
		super();
		Object.assign(this, props);
		if (target) {
			this.setTarget(target);
		}
	}
}

@Entity({ discriminatorValue: undefined })
export class SchoolNews extends News {
	/** id reference to a collection */
	@Property()
	target: undefined;

	/** name of a collection which is referenced in target */
	@Property()
	targetModel: undefined;
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	/** id reference to a collection */
	@ManyToOne()
	target?: CourseInfo;

	/** name of a collection which is referenced in target */
	@Property()
	targetModel: typeof NewsTargetModel.Course;
}

@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	/** id reference to a collection */
	@ManyToOne()
	target?: TeamInfo;

	/** name of a collection which is referenced in target */
	@Property()
	targetModel: typeof NewsTargetModel.Team;
}
