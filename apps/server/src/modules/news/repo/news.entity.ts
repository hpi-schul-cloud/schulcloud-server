import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { CourseEntity } from '@modules/course/repo';
import { SchoolEntity } from '@modules/school/repo';
import type { TeamEntity } from '@modules/team/repo';
import type { User } from '@modules/user/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { NewsTarget, NewsTargetModel } from '../domain/type';
import { ObjectId } from '@mikro-orm/mongodb';

export interface NewsProperties {
	title: string;
	content: string;
	displayAt: Date;
	school: EntityId | SchoolEntity;
	creator?: EntityId | User;
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
@Index({ properties: ['school', 'target'] })
@Index({ properties: ['school', 'target', 'targetModel'] })
@Index({ properties: ['target', 'targetModel'] })
export abstract class News extends BaseEntityWithTimestamps {
	/** the news title */
	@Property()
	title: string;

	/** the news content as html */
	@Property()
	content: string;

	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	@Property()
	@Index()
	displayAt: Date;

	@Property({ nullable: true })
	externalId?: string;

	@Property({ nullable: true })
	source?: 'internal' | 'rss';

	@Property({ nullable: true })
	sourceDescription?: string;

	/** id reference to a collection populated later with name */
	target!: NewsTarget;

	/** name of a collection which is referenced in target */
	@Enum()
	targetModel!: NewsTargetModel;

	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	school!: SchoolEntity;

	@ManyToOne('User', { fieldName: 'creatorId', nullable: true })
	@Index()
	creator?: User;

	@ManyToOne('User', { fieldName: 'updaterId', nullable: true })
	@Index()
	updater?: User;

	permissions: string[] = [];

	public removeCreatorReference(creatorId: EntityId): void {
		if (creatorId === this.creator?.id) {
			this.creator = undefined;
		}
	}

	public removeUpdaterReference(updaterId: EntityId): void {
		if (updaterId === this.updater?.id) {
			this.updater = undefined;
		}
	}

	constructor(props: NewsProperties) {
		super();
		this.title = props.title;
		this.content = props.content;
		this.displayAt = props.displayAt;
		Object.assign(this, { school: props.school, creator: props.creator, updater: props.updater, target: props.target });
		this.externalId = props.externalId;
		this.source = props.source;
		this.sourceDescription = props.sourceDescription;
	}

	public static createInstance(targetModel: NewsTargetModel, props: NewsProperties): News {
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
	@ManyToOne(() => SchoolEntity)
	target!: SchoolEntity;

	constructor(props: NewsProperties) {
		super(props);
		this.targetModel = NewsTargetModel.School;
	}
}

@Entity({ discriminatorValue: NewsTargetModel.Course })
export class CourseNews extends News {
	@ManyToOne(() => CourseEntity)
	target!: CourseEntity;

	constructor(props: NewsProperties) {
		super(props);
		this.targetModel = NewsTargetModel.Course;
	}
}

@Entity({ discriminatorValue: NewsTargetModel.Team })
export class TeamNews extends News {
	@ManyToOne('TeamEntity')
	target!: TeamEntity;

	constructor(props: NewsProperties) {
		super(props);
		this.targetModel = NewsTargetModel.Team;
	}
}
