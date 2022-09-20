import { Entity, Enum, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from './base.entity';
import { EntityId } from '../types/entity-id';

export enum ShareTokenParentType {
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
}

export enum ShareTokenContextType {
	'School' = 'schools',
}

export type ShareTokenString = string;

export interface IShareTokenProperties {
	token: ShareTokenString;
	parentType: ShareTokenParentType;
	parentId: EntityId | ObjectId;
	contextType?: ShareTokenContextType;
	contextId?: EntityId | ObjectId;
	expiresAt?: Date;
}

@Entity({ tableName: 'sharetokens' })
export class ShareToken extends BaseEntityWithTimestamps {
	@Property()
	token: ShareTokenString;

	@Enum()
	parentType: ShareTokenParentType;

	@Property({ fieldName: 'parent' })
	_parentId: ObjectId;

	get parentId(): EntityId {
		return this._parentId.toHexString();
	}

	@Enum({ nullable: true })
	contextType?: ShareTokenContextType;

	@Property({ fieldName: 'context', nullable: true })
	_contextId?: ObjectId;

	get contextId(): EntityId | undefined {
		return this._contextId?.toHexString();
	}

	@Property({ nullable: true })
	expiresAt?: Date;

	constructor(props: IShareTokenProperties) {
		super();
		this.token = props.token;
		this.parentType = props.parentType;
		this._parentId = new ObjectId(props.parentId);
		this.contextType = props.contextType;
		if (props.contextId !== undefined) {
			this._contextId = new ObjectId(props.contextId);
		}
		this.expiresAt = props.expiresAt;
	}
}
