import { Exclude, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { ObjectId } from 'mongoose';

const ObjectIdToString = ({ value }) => value.toString();
class BaseEntity {
	@Transform(ObjectIdToString, { toPlainOnly: true })
	_id: ObjectId;
	@IsInt()
	@Exclude()
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
	_id: ObjectId;
	firstName: string;
	lastName: string;
}

class PopulatedSchoolName {
	_id: ObjectId;
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
	externalId?: ObjectId;
	@Exclude()
	sourceDescription?: string;

	// target and targetModel must either exist or not exist
	/** id reference to a collection */
	target?: ObjectId;
	/** name of a collection which is referenced in target */
	targetModel?: string;

	// populated entities

	// @Transform((value) => String(value), { toPlainOnly: true })
	schoolId: ObjectId;
	/** school name of referenced schoolId */
	school: PopulatedSchoolName;

	/** user id of creator */
	creatorId: ObjectId;
	/** creatorname of referenced creatorId */
	creator: PopulatedUserName;

	/** when updated, the user id of the updating user */
	updaterId?: ObjectId;
	updater?: PopulatedUserName;

	permissions: string[];

	constructor(partial: Partial<NewsEntity>) {
		super(partial);
		Object.assign(this, partial);
	}
}
