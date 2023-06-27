import { EntityId, VideoConferenceScope } from '@shared/domain';

export class ScopeRef {
	id: EntityId;

	scope: VideoConferenceScope;

	constructor(id: EntityId, scope: VideoConferenceScope) {
		this.id = id;
		this.scope = scope;
	}
}
