import { EntityId } from '@shared/domain/types';
import { VideoConferenceScope } from '../../domain';

export class ScopeRef {
	public id: EntityId;

	public scope: VideoConferenceScope;

	constructor(id: EntityId, scope: VideoConferenceScope) {
		this.id = id;
		this.scope = scope;
	}
}
