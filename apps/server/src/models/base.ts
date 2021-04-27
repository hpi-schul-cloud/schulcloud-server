import { Types } from 'mongoose';
import { applyDecorators } from '@nestjs/common';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** decorator: convert mongo ObjectId to string */
export function ObjectIdToString({ value }) {
	return value instanceof Types.ObjectId ? value.toHexString() : value?.toString();
}

/** decorator: validation and openapi spec for mongo object id */
export function ExposeMongoIdAsString() {
	return applyDecorators(
		Expose(),
		/** Convert mongo ids to string when serializing */
		Transform(ObjectIdToString, { toPlainOnly: true }),

		/** set api property type as string with mongo id format */
		ApiProperty({ type: String, format: '/^[a-f0-9]{24}$/gi' })
	);
}

export class BaseModel {
	@ExposeMongoIdAsString()
	_id: Types.ObjectId;
	@IsInt()
	@Exclude()
	__v?: number;
}

export class WithTimeStampBaseModel extends BaseModel {
	/** the documents creation date */
	@Expose()
	createdAt: Date;
	/** the documents update date which is optional */
	@Expose()
	updatedAt?: Date;
}
