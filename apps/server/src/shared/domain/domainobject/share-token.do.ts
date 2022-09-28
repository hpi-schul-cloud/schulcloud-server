import { EntityId } from '../types';
import { BaseWithTimestampsDO } from './base.do';

export enum ShareTokenParentType {
	'Course' = 'courses',
	'Task' = 'tasks',
	'Lesson' = 'lessons',
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

export class ShareTokenDO extends BaseWithTimestampsDO {
	token: ShareTokenString;

	payload: ShareTokenPayload;

	context?: ShareTokenContext;

	expiresAt?: Date;

	constructor(props: ShareTokenDO) {
		super(props);
		this.token = props.token;
		this.payload = props.payload;
		this.context = props.context;
		this.expiresAt = props.expiresAt;
	}
}
