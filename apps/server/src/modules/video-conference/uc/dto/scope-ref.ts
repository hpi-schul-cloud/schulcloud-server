import { VideoConferenceScope } from '@shared/domain';
import { EntityId } from '@shared/domain/types';

export class ScopeRef {
	id: EntityId;

	scope: VideoConferenceScope;

	constructor(id: EntityId, scope: VideoConferenceScope) {
		this.id = id;
		this.scope = scope;
	}
}
