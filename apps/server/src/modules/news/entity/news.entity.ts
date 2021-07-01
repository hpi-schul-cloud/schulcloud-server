import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity, BaseEntityWithTimestamps, EntityId } from '@shared/domain';
import { CourseInfo } from './course-info.entity';
import { NewsTargetModel } from './news.types';
import { SchoolInfo } from './school-info.entity';
import { TeamInfo } from './team-info.entity';
import { UserInfo } from './user-info.entity';

export interface INewsProperties {
	title: string;
	content: string;
	displayAt: Date;
	school: EntityId;
	creator: EntityId;
	target: EntityId;

	externalId?: string;
	source?: 'internal' | 'rss';
	sourceDescription?: string;
	updater?: EntityId;
}

@Entity({
	discriminatorColumn: 'targetModel',
	abstract: true,
})
export abstract class News extends BaseEntityWithTimestamps {
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
	target!: BaseEntity;

	/** name of a collection which is referenced in target */
	@Property()
	targetModel: NewsTargetModel;

	@ManyToOne({ fieldName: 'schoolId' })
	school!: SchoolInfo;

	@ManyToOne({ fieldName: 'creatorId' })
	creator!: UserInfo;

	@ManyToOne({ fieldName: 'updaterId' })
	updater?: UserInfo;

	permissions: string[] = [];

	constructor(props: INewsProperties) {
		super();
		this.title = props.title;
		this.content = props.content;
		this.displayAt = props.displayAt;
		Object.assign(this, { school: props.school, creator: props.creator, target: props.target });
	}

	static createInstance(targetModel: NewsTargetModel, props: INewsProperties): News {
		let news: News;
		if (targetModel === NewsTargetModel.Course) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			news = new CourseNews(props);
		} else if (targetModel === NewsTargetModel.Team) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			news = new TeamNews(props);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			news = new SchoolNews(props);
		}
		return news;
	}
}

@Entity({ discriminatorValue: NewsTargetModel.School })
export class SchoolNews extends News {
	@ManyToOne()
	target: SchoolInfo;
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	@ManyToOne()
	target: CourseInfo;
}

@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	@ManyToOne()
	target: TeamInfo;
}
