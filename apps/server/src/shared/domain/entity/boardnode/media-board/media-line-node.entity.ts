import { Entity, Property } from '@mikro-orm/core';
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
	}

	@Property({ nullable: false })
	title: string;

	@Property({ nullable: false })
	backgroundColor: string;

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject: MediaLine = builder.buildMediaLine(this);
		return domainObject;
	}
}

export interface MediaLineNodeProps extends BoardNodeProps {
	title: string;
	backgroundColor: string;
}
