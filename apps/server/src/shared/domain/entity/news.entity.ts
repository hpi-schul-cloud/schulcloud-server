import { Entity, Enum, ManyToOne, Property, wrap } from '@mikro-orm/core';
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
	title: string;

	/** the news content as html */
	@Property()
	content: string;

	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	@Property()
	displayAt: Date;

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
	targetModel!: NewsTargetModel;

	@ManyToOne('School', { fieldName: 'schoolId' })
	school: School;

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
		this.school = wrap(this.school).assign(props.school);
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
		} else if (targetModel === NewsTargetModel.School) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			news = new SchoolNews(props);
		} else {
			throw new Error(`wrong targetModel provided: ${JSON.stringify(targetModel)}`);
		}
		return news;
	}
}

export interface ISchoolNewsProperties extends INewsProperties {
	target: School;
}
@Entity({ discriminatorValue: NewsTargetModel.School })
export class SchoolNews extends News {
	constructor(schoolNews: INewsProperties) {
		super(schoolNews);
		this.targetModel = NewsTargetModel.School;
		this.target = schoolNews.target as School;
	}

	@ManyToOne('School')
	target: School;
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	constructor(courseNews: INewsProperties) {
		super(courseNews);
		this.targetModel = NewsTargetModel.Course;
		this.target = courseNews.target as Course;
	}

	@ManyToOne('Course')
	target: Course;
}

export interface ITeamNewsProperties extends INewsProperties {
	target: Team;
}
@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	constructor(teamNews: INewsProperties) {
		super(teamNews);
		this.targetModel = NewsTargetModel.Team;
		this.target = teamNews.target as Team;
	}

	@ManyToOne('Team')
	target: Team;
}
