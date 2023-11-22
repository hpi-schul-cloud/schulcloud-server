import { EntityId } from '@shared/domain';

export interface ScopeInfo {
	scopeId: EntityId;

	scopeName: string;

	title: string;

	logoutUrl: string;
}
