import { EntityId } from '@shared/domain/types';

export type AuthorId = string;
export type GroupId = string;
export type SessionId = string;
export type PadId = string;

export interface EtherpadParams {
	userId?: EntityId;
	parentId?: EntityId;
}

export interface EtherpadResponse {
	code?: number;
	message?: string;
	data?: unknown;
}
