import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import type { AnyBoardDo, BoardExternalReference, BoardExternalReferenceType, MediaBoard } from '../../../domainobject';
import { BoardNode, type BoardNodeProps } from '../boardnode.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

@Entity({ discriminatorValue: BoardNodeType.MEDIA_BOARD })
export class MediaBoardNode extends BoardNode {
	constructor(props: MediaBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_BOARD;

		this.contextType = props.context.type;
		this.contextId = new ObjectId(props.context.id);
	}

	@Property({ fieldName: 'contextType' })
	contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	contextId: ObjectId;

	get context(): BoardExternalReference {
		return {
			type: this.contextType,
			id: this.contextId.toHexString(),
		};
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaBoard = builder.buildMediaBoard(this);
		return domainObject;
	}
}

export interface MediaBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
}
