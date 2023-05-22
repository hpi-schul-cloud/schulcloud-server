import { Entity, Property } from '@mikro-orm/core';
import { Card } from '@shared/domain/domainobject';
import { BoardNode, BoardNodeProps } from './boardnode.entity';
import { BoardDoBuilder, BoardNodeType } from './types';

@Entity({ discriminatorValue: BoardNodeType.CARD })
export class CardNode extends BoardNode {
	constructor(props: CardNodeProps) {
		super(props);
		this.type = BoardNodeType.CARD;
		this.height = props.height;
	}

	@Property()
	height: number;

	useDoBuilder(builder: BoardDoBuilder): Card {
		const domainObject = builder.buildCard(this);
		return domainObject;
	}
}

export interface CardNodeProps extends BoardNodeProps {
	height: number;
}
