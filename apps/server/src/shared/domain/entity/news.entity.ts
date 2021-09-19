import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import { EntityId } from '../types/entity-id';
import { Course } from './course.entity';
import { School } from './school.entity';
import { Team } from './team.entity';
import { User } from './user.entity';
import { NewsTargetInfo, NewsTargetModel } from '../types/news.types';

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

	/** id reference to a collection populated later with name */
	target!: NewsTargetInfo;

	/** name of a collection which is referenced in target */
	@Enum()
	targetModel: NewsTargetModel;

	@ManyToOne({ fieldName: 'schoolId' })
	school!: School;

	@ManyToOne({ fieldName: 'creatorId' })
	creator!: User;

	@ManyToOne({ fieldName: 'updaterId' })
	updater?: User;

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
	target: School;
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	@ManyToOne()
	target: Course;
}

@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	@ManyToOne()
	target: Team;
}
