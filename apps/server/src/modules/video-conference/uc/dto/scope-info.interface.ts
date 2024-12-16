import { VideoConferenceScope } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';

export interface ScopeInfo {
	scopeId: EntityId;

	scopeName: VideoConferenceScope;

	title: string;

	logoutUrl: string;
}
