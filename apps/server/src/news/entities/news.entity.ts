import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsString, Matches } from 'class-validator';
import { Types, LeanDocument } from 'mongoose';

const ObjectIdToString = ({ value }) => (value instanceof Types.ObjectId ? value.toHexString() : value?.toString());

/** validation and openapi spec for mongo object id */
export function ExposeMongoIdAsString() {
	return applyDecorators(
		Expose(),
		/** Convert mongo ids to string when serializing */
		Transform(ObjectIdToString, { toPlainOnly: true }),

		/** set api property type as string with mongo id format */
		ApiProperty({ type: String, format: '/^[a-f0-9]{24}$/gi' })
	);
}
class BaseEntity {
	@ExposeMongoIdAsString()
	_id: Types.ObjectId;
	@IsInt()
	@Exclude()
	__v?: number;
}

class WithTimeStampBaseEntity extends BaseEntity {
	/** the documents creation date */
	@Expose()
	createdAt: Date;
	/** the documents update date which is optional */
	@Expose()
	updatedAt?: Date;
}

export class UserEntity {
	@ExposeMongoIdAsString()
	_id: Types.ObjectId;
	@Expose()
	firstName: string;
	@Expose()
	lastName: string;
	@Expose()
	get fullName() {
		return this.firstName + ' ' + this.lastName;
	}
}

export class SchoolEntity {
	@ExposeMongoIdAsString()
	_id: Types.ObjectId;
	/** the schools name */
	@Expose()
	name: string;
}

export class NewsEntity extends WithTimeStampBaseEntity {
	/** the news title */
	@Expose()
	title: string;
	/** the news content as html */
	@Expose()
	content: string;
	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	@Expose()
	displayAt: Date;

	@Expose()
	source: 'internal' | 'rss';

	// hidden api properties

	@Exclude()
	externalId?: string;
	@Exclude()
	sourceDescription?: string;

	// target and targetModel both must either exist or not
	@ExposeMongoIdAsString()
	/** id reference to a collection */
	target?: Types.ObjectId;
	/** name of a collection which is referenced in target */
	@Expose()
	targetModel?: string;

	// populated properties

	@ExposeMongoIdAsString()
	schoolId: Types.ObjectId;

	/** user id of creator */
	@ExposeMongoIdAsString()
	creatorId: Types.ObjectId;

	/** when updated, the user id of the updating user */
	@ExposeMongoIdAsString()
	updaterId?: Types.ObjectId;

	@Type(() => SchoolEntity)
	@Expose()
	school?: SchoolEntity;

	@Type(() => UserEntity)
	@Expose()
	creator?: UserEntity;

	@Type(() => UserEntity)
	@Expose()
	updater?: UserEntity;

	// decorated properties
	@Expose()
	permissions: string[] = [];

	constructor(partial: Partial<NewsEntity>) {
		super();
		Object.assign(this, partial);
	}
}

export type News = LeanDocument<NewsEntity>;
