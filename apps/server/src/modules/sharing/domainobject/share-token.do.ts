import { EntityId } from '@shared/domain/types';
import { BaseDO } from '@shared/domain/domainobject';

export enum ShareTokenParentType {
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
	'ColumnBoard' = 'columnBoard',
}

export enum ShareTokenContextType {
	'School' = 'schools',
}

export type ShareTokenString = string;

export type ShareTokenPayload = {
	parentType: ShareTokenParentType;
	parentId: EntityId;
};

export type ShareTokenContext = {
	contextType: ShareTokenContextType;
	contextId: EntityId;
};

export class ShareTokenDO extends BaseDO {
	token: ShareTokenString;

	payload: ShareTokenPayload;

	context?: ShareTokenContext;

	expiresAt?: Date;

	constructor(domainObject: ShareTokenDO) {
		super(domainObject.id);

		this.token = domainObject.token;
		this.payload = domainObject.payload;
		this.context = domainObject.context;
		this.expiresAt = domainObject.expiresAt;
	}
}
