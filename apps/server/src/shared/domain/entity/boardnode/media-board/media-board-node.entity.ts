import { Entity, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
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
		this._mediaAvailableLineCollapsed = props.mediaAvailableLineCollapsed;
		this._mediaAvailableLineBackgroundColor = props.mediaAvailableLineBackgroundColor;
	}

	@Property({ fieldName: 'contextType' })
	_contextType: BoardExternalReferenceType;

	@Property({ fieldName: 'context' })
	_contextId: ObjectId;

	@Property({ fieldName: 'mediaAvailableLineBackgroundColor' })
	_mediaAvailableLineBackgroundColor: string;

	@Property({ fieldName: 'mediaAvailableLineCollapsed' })
	_mediaAvailableLineCollapsed: boolean;

	get context(): BoardExternalReference {
		return {
			type: this._contextType,
			id: this._contextId.toHexString(),
		};
	}

	get mediaAvailableLineCollapsed(): boolean {
		return this._mediaAvailableLineCollapsed;
	}

	set mediaAvailableLineCollapsed(mediaAvailableLineCollapsed: boolean) {
		this._mediaAvailableLineCollapsed = mediaAvailableLineCollapsed;
	}

	get mediaAvailableLineBackgroundColor(): string {
		return this._mediaAvailableLineBackgroundColor;
	}

	set mediaAvailableLineBackgroundColor(mediaAvailableLineBackgroundColor: string) {
		this._mediaAvailableLineBackgroundColor = mediaAvailableLineBackgroundColor;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaBoard = builder.buildMediaBoard(this);

		return domainObject;
	}
}

export interface MediaBoardNodeProps extends BoardNodeProps {
	context: BoardExternalReference;
	mediaAvailableLineBackgroundColor: string;
	mediaAvailableLineCollapsed: boolean;
}
