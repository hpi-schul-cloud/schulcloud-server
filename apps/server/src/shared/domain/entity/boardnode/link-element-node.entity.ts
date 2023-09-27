import { Entity, Property } from '@mikro-orm/core';
import { AnyBoardDo } from '../../domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.LINK_ELEMENT })
export class LinkElementNode extends BoardNode {
	@Property()
	url: string;

	constructor(props: LinkElementNodeProps) {
		super(props);
		this.type = BoardNodeType.LINK_ELEMENT;
		this.url = props.url;
	}

	useDoBuilder(builder: BoardDoBuilder): AnyBoardDo {
		const domainObject = builder.buildLinkElement(this);

		return domainObject;
	}
}

export interface LinkElementNodeProps extends BoardNodeProps {
	url: string;
}
