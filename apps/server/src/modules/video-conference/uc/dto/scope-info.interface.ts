import { EntityId } from '@shared/domain/types/entity-id';

export interface IScopeInfo {
	scopeId: EntityId;

	scopeName: string;

	title: string;

	logoutUrl: string;
}
