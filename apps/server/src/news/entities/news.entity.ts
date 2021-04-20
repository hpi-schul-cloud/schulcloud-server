import { Exclude, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { ObjectId } from 'mongoose';

class BaseEntity {
	// @Transform((value) => String(value), { toPlainOnly: true })
	_id: string;
	@IsInt()
	__v: number;
	constructor(partial: Partial<BaseEntity>) {
		Object.assign(this, partial);
	}
}

class WithTimeStampBaseEntity extends BaseEntity {
	/** the documents creation date */
	createdAt: Date;
	/** the documents update date which is optional */
	updatedAt?: Date;

	constructor(partial: Partial<WithTimeStampBaseEntity>) {
		super(partial);
		Object.assign(this, partial);
	}
}

class PopulatedUserName {
	_id: string;
	firstName: string;
	lastName: string;
}

class PopulatedSchoolName {
	_id: string;
	name: string;
}

export class NewsEntity extends WithTimeStampBaseEntity {
	/** the news title */
	title: string;
	/** the news content as html */
	content: string;
	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	displayAt: Date;

	source: 'internal' | 'rss';

	// hidden properties

	@Exclude()
	externalId?: string;
	@Exclude()
	sourceDescription?: string;

	// target and targetModel must either exist or not exist
	/** id reference to a collection */
	target?: ObjectId;
	/** name of a collection which is referenced in target */
	targetModel?: string;

	// populated entities

	// @Transform((value) => String(value), { toPlainOnly: true })
	schoolId: string;
	/** school name of referenced schoolId */
	school: PopulatedSchoolName;

	/** user id of creator */
	creatorId: string;
	/** creatorname of referenced creatorId */
	creator: PopulatedUserName;

	/** when updated, the user id of the updating user */
	updaterId?: string;
	updater?: PopulatedUserName;

	permissions: string[];

	constructor(partial: Partial<NewsEntity>) {
		super(partial);
		Object.assign(this, partial);
	}
}
