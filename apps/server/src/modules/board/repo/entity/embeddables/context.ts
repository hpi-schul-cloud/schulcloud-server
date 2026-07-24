import { Embeddable, Enum, Property } from '@mikro-orm/core';
import type { EntityId } from '@shared/domain/types';
import { ObjectIdType } from '@shared/repo/types/object-id.type';
import { BoardExternalReference, BoardExternalReferenceType } from '../../../domain';

@Embeddable()
export class Context implements BoardExternalReference {
	constructor(props: BoardExternalReference) {
		this._contextType = props.type;
		this._contextId = props.id;
	}

	@Enum({ fieldName: 'contextType', items: () => BoardExternalReferenceType })
	public _contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'contextId', type: ObjectIdType })
	public _contextId: EntityId;

	get type(): BoardExternalReferenceType {
		return this._contextType;
	}

	set type(value: BoardExternalReferenceType) {
		this._contextType = value;
	}

	get id(): EntityId {
		return this._contextId;
	}

	set id(value: EntityId) {
		this._contextId = value;
	}
}
