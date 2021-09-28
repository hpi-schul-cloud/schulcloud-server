import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { Course } from './course.entity';
import type { School } from './school.entity';
import type { Team } from './team.entity';
import type { User } from './user.entity';
import { NewsTarget, NewsTargetModel } from '../types/news.types';
import { EntityId } from '../types';

export interface INewsProperties {
	title: string;
	content: string;
	displayAt: Date;
	school: EntityId | School;
	creator: EntityId | User;
	target: EntityId | NewsTarget;

	externalId?: string;
	source?: 'internal' | 'rss';
	sourceDescription?: string;
	updater?: User;
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
	target!: NewsTarget;

	/** name of a collection which is referenced in target */
	@Enum()
	targetModel: NewsTargetModel;

	@ManyToOne('School', { fieldName: 'schoolId' })
	school!: School;

	@ManyToOne('User', { fieldName: 'creatorId' })
	creator!: User;

	@ManyToOne('User', { fieldName: 'updaterId' })
	updater?: User;

	permissions: string[] = [];

	constructor(props: INewsProperties) {
		super();
		this.title = props.title;
		this.content = props.content;
		this.displayAt = props.displayAt;
		Object.assign(this, { school: props.school, creator: props.creator, updater: props.updater, target: props.target });
		this.externalId = props.externalId;
		this.source = props.source;
		this.sourceDescription = props.sourceDescription;
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
	@ManyToOne('School')
	target: School;
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	@ManyToOne('Course')
	target: Course;
}

@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	@ManyToOne('Team')
	target: Team;
}
