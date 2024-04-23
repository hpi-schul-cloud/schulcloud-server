import { Entity, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	type AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	type MediaBoard,
} from '../../../domainobject';
import { BoardNode } from '../boardnode.entity';
import { type RootBoardNodeProps } from '../root-board-node.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

// TODO Use an abstract base class for root nodes that have a contextId and a contextType. Multiple STI abstract base classes are blocked by MikroORM 6.1.2 (issue #3745)
@Entity({ discriminatorValue: BoardNodeType.MEDIA_BOARD })
@Index({ properties: ['_contextId', '_contextType'] })
export class MediaBoardNode extends BoardNode {
	constructor(props: RootBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_BOARD;

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

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaBoard = builder.buildMediaBoard(this);

		return domainObject;
	}
}
