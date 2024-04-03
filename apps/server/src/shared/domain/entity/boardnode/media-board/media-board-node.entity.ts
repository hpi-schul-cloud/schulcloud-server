import { Entity } from '@mikro-orm/core';
import type { AnyBoardDo, MediaBoard } from '../../../domainobject';
import { RootBoardNode, type RootBoardNodeProps } from '../root-board-node.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

@Entity({ discriminatorValue: BoardNodeType.MEDIA_BOARD })
export class MediaBoardNode extends RootBoardNode {
	constructor(props: RootBoardNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_BOARD;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaBoard = builder.buildMediaBoard(this);

		return domainObject;
	}
}
