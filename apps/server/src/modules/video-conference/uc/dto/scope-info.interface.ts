import { EntityId } from '@shared/domain';

export interface IScopeInfo {
	scopeId: EntityId;

	scopeName: string;

	title: string;

	logoutUrl: string;
}
