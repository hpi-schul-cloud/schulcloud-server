import { VideoConferenceScope } from '@shared/domain/interface/video-conference-scope.enum';
import { EntityId } from '@shared/domain/types/entity-id';

export class ScopeRef {
	id: EntityId;

	scope: VideoConferenceScope;

	constructor(id: EntityId, scope: VideoConferenceScope) {
		this.id = id;
		this.scope = scope;
	}
}
