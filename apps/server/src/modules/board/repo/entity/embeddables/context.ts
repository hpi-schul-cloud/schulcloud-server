import { Embeddable, Property } from '@mikro-orm/core';
import type { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { BoardExternalReference, BoardExternalReferenceType } from '../../../domain';

@Embeddable()
export class Context implements BoardExternalReference {
	constructor(props: BoardExternalReference) {
		this._contextType = props.type;
		this._contextId = props.id;
	}

	@Property({ fieldName: 'contextType' })
	public _contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context', type: ObjectIdType })
	public _contextId: EntityId;

	get type(): BoardExternalReferenceType {
		return this._contextType;
	}

	get id(): EntityId {
		return this._contextId;
	}
}
