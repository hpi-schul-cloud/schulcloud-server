import { Entity } from '@mikro-orm/core';
import type { AnyBoardDo, MediaLine } from '../../../domainobject';
import { BoardNode, type BoardNodeProps } from '../boardnode.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

@Entity({ discriminatorValue: BoardNodeType.MEDIA_LINE })
export class MediaLineNode extends BoardNode {
	constructor(props: BoardNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_LINE;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaLine = builder.buildMediaLine(this);
		return domainObject;
	}
}
