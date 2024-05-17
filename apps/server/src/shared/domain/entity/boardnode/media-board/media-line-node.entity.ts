import { Entity, Enum, Property } from '@mikro-orm/core';
import { MediaBoardColors } from '@modules/board/domain';
import type { AnyBoardDo, MediaLine } from '../../../domainobject';
import { BoardNode, type BoardNodeProps } from '../boardnode.entity';
import { type BoardDoBuilder, BoardNodeType } from '../types';

@Entity({ discriminatorValue: BoardNodeType.MEDIA_LINE })
export class MediaLineNode extends BoardNode {
	constructor(props: MediaLineNodeProps) {
		super(props);
		this.type = BoardNodeType.MEDIA_LINE;

		this.title = props.title;
		this.backgroundColor = props.backgroundColor;
		this.collapsed = props.collapsed;
	}

	@Property()
	title: string;

	@Enum(() => MediaBoardColors)
	backgroundColor: MediaBoardColors;

	@Property()
	collapsed: boolean;

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaLine = builder.buildMediaLine(this);
		return domainObject;
	}
}

export interface MediaLineNodeProps extends BoardNodeProps {
	title: string;
	backgroundColor: MediaBoardColors;
	collapsed: boolean;
}
