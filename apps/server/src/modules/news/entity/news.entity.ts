import { Entity, ManyToOne, Property, Reference } from '@mikro-orm/core';
import { BaseEntity, BaseEntityWithTimestamps } from '../../../shared/domain';
import { SchoolInfo } from './school-info.entity';
import { UserInfo } from './user-info.entity';
@Entity()
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

	// /** id reference to a collection */
	// @ManyToOne()
	target?: { id: string };

	// /** name of a collection which is referenced in target */
	// @Property()
	targetModel?: string;

	@ManyToOne({ fieldName: 'schoolId' })
	school: SchoolInfo;

	@ManyToOne({ fieldName: 'creatorId' })
	creator: UserInfo;

	@ManyToOne({ fieldName: 'updaterId' })
	updater?: UserInfo;

	permissions: string[] = [];

	constructor(props: { title: string; content: string; displayAt: Date }) {
		super();
		this.title = props.title;
		this.content = props.content;
		this.displayAt = props.displayAt;
	}
}
