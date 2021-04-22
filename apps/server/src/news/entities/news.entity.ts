import { applyDecorators } from '@nestjs/common';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
import { IsInt, IsString, Matches } from 'class-validator';
import { Types, Document, LeanDocument } from 'mongoose';

const ObjectIdToString = ({ value }) => (value instanceof Types.ObjectId ? value.toHexString() : value.toString());

/** validation and openapi spec for mongo object id */
export function IsMongoIdString() {
	return applyDecorators(
		/** Convert mongo ids to string when serializing */
		Transform(ObjectIdToString, { toPlainOnly: true }),

		/** Parse and validate as MongoId when loading */
		IsString(),
		Matches(/^[a-f0-9]{24}$/gi),

		/** set api property type as string with mongo id format */
		ApiProperty({ type: String, format: '/^[a-f0-9]{24}$/gi' })
	);
}
class BaseEntity {
	@IsMongoIdString()
	_id: Types.ObjectId;
	@IsInt()
	@Exclude()
	__v: number;
}

class WithTimeStampBaseEntity extends BaseEntity {
	/** the documents creation date */
	createdAt: Date;
	/** the documents update date which is optional */
	updatedAt?: Date;
}

class UserEntity {
	@IsMongoIdString()
	_id: Types.ObjectId;
	firstName: string;
	lastName: string;
}

class SchoolEntity {
	@IsMongoIdString()
	_id: Types.ObjectId;
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
	@IsMongoIdString()
	target?: Types.ObjectId;
	/** name of a collection which is referenced in target */
	targetModel?: string;

	// populated entities

	@IsMongoIdString()
	schoolId: Types.ObjectId;

	/** user id of creator */
	@IsMongoIdString()
	creatorId: Types.ObjectId;

	/** when updated, the user id of the updating user */
	@IsMongoIdString()
	updaterId?: Types.ObjectId;

	/** school name of referenced schoolId */
	@Type(() => SchoolEntity)
	school?: SchoolEntity;
	/** creatorname of referenced creatorId */
	@Type(() => UserEntity)
	creator?: UserEntity;
	@Type(() => UserEntity)
	updater?: UserEntity;
	permissions?: string[];

	constructor(partial: Partial<NewsEntity>) {
		super();
		Object.assign(this, partial);
	}
}

export type News = LeanDocument<NewsEntity>;
