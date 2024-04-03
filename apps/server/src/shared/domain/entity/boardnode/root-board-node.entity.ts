import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReference, BoardExternalReferenceType } from '@shared/domain/domainobject/board/types';
import { BoardNode, BoardNodeProps } from './boardnode.entity';

@Entity({ abstract: true })
export abstract class RootBoardNode extends BoardNode {
	constructor(props: RootBoardNodeProps) {
		super(props);
		this._contextType = props.context.type;
		this._contextId = new ObjectId(props.context.id);
	}

	@Property({ fieldName: 'contextType' })
	_contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	_contextId: ObjectId;

	get context(): BoardExternalReference {
		return {
			type: this._contextType,
			id: this._contextId.toHexString(),
		};
	}
}

export interface RootBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
}
