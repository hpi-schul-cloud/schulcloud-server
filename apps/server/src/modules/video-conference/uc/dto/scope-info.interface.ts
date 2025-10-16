import { EntityId } from '@shared/domain/types';
import { VideoConferenceScope } from '../../domain';

export interface ScopeInfo {
	scopeId: EntityId;

	scopeName: VideoConferenceScope;

	title: string;

	logoutUrl: string;
}
