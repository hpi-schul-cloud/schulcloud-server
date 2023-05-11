import { EntityId } from './types';

export interface AuthorizableObject {
	get id(): EntityId;
}
