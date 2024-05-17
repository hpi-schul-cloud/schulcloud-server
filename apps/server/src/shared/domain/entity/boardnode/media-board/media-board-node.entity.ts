import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaBoardColors, MediaBoardLayoutType } from '@modules/board/domain';
import {
	type AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	type MediaBoard,
} from '../../../domainobject';
import { BoardNode, BoardNodeProps } from '../boardnode.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

// TODO Use an abstract base class for root nodes that have a contextId and a contextType. Multiple STI abstract base classes are blocked by MikroORM 6.1.2 (issue #3745)
@Entity({ discriminatorValue: BoardNodeType.MEDIA_BOARD })
@Index({ properties: ['_contextId'] })
@Index({ properties: ['_contextType'] })
export class MediaBoardNode extends BoardNode {
	constructor(props: MediaBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_BOARD;

		this._contextType = props.context.type;
		this._contextId = new ObjectId(props.context.id);
		this.layout = props.layout;
		this.mediaAvailableLineCollapsed = props.mediaAvailableLineCollapsed;
		this.mediaAvailableLineBackgroundColor = props.mediaAvailableLineBackgroundColor;
	}

	@Property({ fieldName: 'contextType' })
	_contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	_contextId: ObjectId;

	@Property()
	layout: MediaBoardLayoutType;

	@Enum()
	mediaAvailableLineBackgroundColor: MediaBoardColors;

	@Property()
	mediaAvailableLineCollapsed: boolean;

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

export interface MediaBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
	layout: MediaBoardLayoutType;
	mediaAvailableLineBackgroundColor: MediaBoardColors;
	mediaAvailableLineCollapsed: boolean;
}
