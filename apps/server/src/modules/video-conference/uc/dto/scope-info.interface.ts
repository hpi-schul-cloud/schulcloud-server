import { EntityId } from '@shared/domain/types';

export interface ScopeInfo {
	scopeId: EntityId;

	scopeName: string;

	title: string;

	logoutUrl: string;
}
