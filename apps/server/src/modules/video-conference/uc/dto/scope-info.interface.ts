import { type EntityId } from '@shared/domain/types';
import { type VideoConferenceScope } from '../../domain';

export interface ScopeInfo {
	scopeId: EntityId;

	scopeName: VideoConferenceScope;

	title: string;

	logoutUrl: string;
}
