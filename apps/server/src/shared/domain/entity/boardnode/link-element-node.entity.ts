import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '@shared/domain/domainobject/board/types/any-board-do';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder } from './types/board-do.builder';
import { BoardNodeType } from './types/board-node-type';

@Entity({ discriminatorValue: BoardNodeType.LINK_ELEMENT })
export class LinkElementNode extends BoardNode {
	@Property()
	url: string;

	@Property()
	title: string;

	@Property()
	imageUrl?: string;

	constructor(props: LinkElementNodeProps) {
		super(props);
		this.type = BoardNodeType.LINK_ELEMENT;
		this.url = props.url;
		this.title = props.title;
		this.imageUrl = props.imageUrl;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildLinkElement(this);

		return domainObject;
	}
}

export interface LinkElementNodeProps extends BoardNodeProps {
	url: string;
	title: string;
	imageUrl?: string;
}
