import { Embeddable, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import type { EntityId } from '@shared/domain/types';
import { BoardExternalReference, BoardExternalReferenceType } from '../../../domain';

@Embeddable()
export class Context implements BoardExternalReference {
	constructor(props: BoardExternalReference) {
		this._contextType = props.type;
		this._contextId = new ObjectId(props.id);
	}

	@Property({ fieldName: 'contextType' })
	_contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	_contextId: ObjectId;

	get type(): BoardExternalReferenceType {
		return this._contextType;
	}

	get id(): EntityId {
		return this._contextId.toHexString();
	}
}